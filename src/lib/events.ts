export const SEARCH_PAPER_EVENT = 'search_paper_selected';

export const emitPaperSelected = (paper: any) => {
  window.dispatchEvent(new CustomEvent(SEARCH_PAPER_EVENT, { detail: paper }));
};