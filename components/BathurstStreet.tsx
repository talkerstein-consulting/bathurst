/** All coordinates use the original 1200 × 630 illustration. Vehicles share its vanishing point. */
const vehicles = [
  { id: "tram", road: "408,575 460,526 463,494 537,437 574,398 579,397 578,435 603,435 603,501 537,593 519,603 406,603", outline: "408,591 410,581 462,533 465,511 470,497 488,481 532,451 555,440 575,401 577,402 562,439 579,436 592,439 598,445 599,498 576,532 541,575 528,587 512,593 476,599 437,599 417,596" },
  { id: "sedan", road: "244,612 252,591 282,561 307,541 343,541 373,557 373,589 317,629 261,629 242,621", outline: "246,614 255,607 260,594 280,579 290,562 303,552 321,547 342,547 349,551 360,554 360,561 366,568 367,579 358,588 347,594 319,618 310,625 280,627 249,621" },
  { id: "taxi", road: "642,517 652,482 666,456 708,456 713,472 702,520", outline: "647,510 650,495 657,483 664,475 668,466 671,461 680,459 695,460 702,463 704,470 710,473 708,484 700,506 695,515 676,516" },
];

// These patches expose the road beneath the three moving silhouettes. The other cars stay parked.
export default function BathurstStreet() {
  return <svg className="bathurst-street" viewBox="0 0 1200 630" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <defs>
      <image id="street-print" href="/brand/og-bathurst.jpg" width="1200" height="630" />
      {vehicles.map(({id, outline}) => <clipPath key={id} id={`cut-${id}`}><polygon points={outline} /></clipPath>)}
      <clipPath id="street-repairs">{vehicles.map(({id, road}) => <polygon key={id} points={road} />)}</clipPath>
      <pattern id="street-paper" width="28" height="22" patternUnits="userSpaceOnUse">
        <svg width="28" height="22" viewBox="635 554 28 22"><use href="#street-print" /></svg>
      </pattern>
    </defs>
    <use href="#street-print" />
    <g className="street-live">
      {vehicles.map(({id, road}) => <polygon key={id} points={road} fill="url(#street-paper)" />)}
      <g fill="none" stroke="#303245" strokeWidth="1.6" clipPath="url(#street-repairs)">
        <path d="M430 630L774 286 M477 630L770 290 M526 630L773 282 M570 630L771 282 M221 630L774 279 M229 630L774 279" />
      </g>
      {vehicles.map(({id}) => <g key={id} className={`street-vehicle street-${id}`}><use href="#street-print" clipPath={`url(#cut-${id})`} /></g>)}
      <g className="street-flock" fill="none" stroke="#384059" strokeWidth="1.5" strokeLinecap="round">
        <path d="M0 3q4 -3 9 2q3 -6 8 -6 M26 12q3 -2 7 1q2 -4 6 -5 M44 1q3 -2 6 2q2 -4 6 -4" />
      </g>
    </g>
  </svg>;
}
