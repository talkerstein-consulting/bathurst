/**
 * Which review is in the fan's centre slot (components/home/ReviewFan.tsx), so the section below can carry that
 * same card on into its first diagram (components/home/CapabilityPanels.tsx).
 *
 * A module-level value rather than context or a store: it is read once, on the frame the hand-off begins, by a
 * component that is already measuring every frame — a subscription would only add a render for a number nothing
 * draws until then. The fan pages on its own, so the card that flies out has to be the one actually on screen,
 * not the one that happened to turn over.
 */
let at = 0;

export const setReviewFocus = (i: number) => { at = i; };
export const getReviewFocus = () => at;
