// Client-side filtering for drill lists. Pages render every drill; this
// script hides the ones that don't match the chosen "How are you practicing?"
// chip and focus chip, keeps both in the URL, and carries the practicing
// choice through links marked `data-carry`. Without JS, every drill shows.
import { isPracticeId, matchesPractice, type PracticeId } from '../lib/practice';

const params = new URLSearchParams(location.search);
const requested = params.get('practice');
let practice: PracticeId = isPracticeId(requested) ? requested : 'any';

const practiceChips = [...document.querySelectorAll<HTMLButtonElement>('[data-practice-chip]')];
const focusChips = [...document.querySelectorAll<HTMLButtonElement>('[data-focus-chip]')];
const cards = [...document.querySelectorAll<HTMLElement>('[data-drill-list] [data-drill]')];
const counts = [...document.querySelectorAll<HTMLElement>('[data-count]')];
const empties = [...document.querySelectorAll<HTMLElement>('[data-empty]')];
const carried = [...document.querySelectorAll<HTMLAnchorElement>('a[data-carry]')];

const focusValues = new Set(focusChips.map((c) => c.dataset.focusChip));
let focus = params.get('focus') ?? 'all';
if (!focusValues.has(focus)) focus = 'all';

const fitsPractice = (card: HTMLElement) =>
  matchesPractice(practice, {
    format: card.dataset.format ?? '',
    space: card.dataset.space ?? '',
    minutes: Number(card.dataset.minutes),
  });
const hasFocus = (card: HTMLElement, value: string) =>
  value === 'all' || (card.dataset.focuses ?? '').split(' ').includes(value);

function render() {
  for (const chip of practiceChips) {
    chip.setAttribute('aria-pressed', String(chip.dataset.practiceChip === practice));
  }
  for (const chip of focusChips) {
    const value = chip.dataset.focusChip!;
    chip.setAttribute('aria-pressed', String(value === focus));
    const count = chip.querySelector('[data-chip-count]');
    if (count) count.textContent = String(cards.filter((c) => fitsPractice(c) && hasFocus(c, value)).length);
  }

  let shown = 0;
  for (const card of cards) {
    const visible = fitsPractice(card) && hasFocus(card, focus);
    card.hidden = !visible;
    if (visible) shown++;
  }
  for (const el of counts) el.textContent = shown === 1 ? '1 drill' : `${shown} drills`;
  for (const el of empties) el.hidden = cards.length === 0 || shown > 0;

  for (const link of carried) {
    link.dataset.href ??= link.getAttribute('href') ?? '';
    const url = new URL(link.dataset.href, location.href);
    if (practice === 'any') url.searchParams.delete('practice');
    else url.searchParams.set('practice', practice);
    link.href = url.pathname + url.search + url.hash;
  }

  const next = new URL(location.href);
  if (practice === 'any') next.searchParams.delete('practice');
  else next.searchParams.set('practice', practice);
  if (focus === 'all' || focusChips.length === 0) next.searchParams.delete('focus');
  else next.searchParams.set('focus', focus);
  history.replaceState(null, '', next.pathname + next.search + next.hash);
}

for (const chip of practiceChips) {
  chip.addEventListener('click', () => {
    practice = chip.dataset.practiceChip as PracticeId;
    render();
  });
}
for (const chip of focusChips) {
  chip.addEventListener('click', () => {
    focus = chip.dataset.focusChip!;
    render();
  });
}

render();
