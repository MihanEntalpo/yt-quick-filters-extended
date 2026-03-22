import { Filter } from '../types';

interface QueryClause {
  raw: string;
  normalized: string;
}

export class UtilsService {
  private static instance: UtilsService;
  private readonly openEndedAttributes = new Set([
    'summary',
    'description',
    'comments',
    'comment',
    'code',
    'work'
  ]);

  public static getInstance(): UtilsService {
    if (!UtilsService.instance) {
      UtilsService.instance = new UtilsService();
    }
    return UtilsService.instance;
  }

  public getCurrentQuery(): string {
    const input = this.getQueryAssistInputElement();

    if (input) {
      return this.normalizeUiQueryText(input.innerText || input.textContent || '');
    }

    return new URLSearchParams(location.search).get('query')?.trim() || '';
  }

  public async setQuery(query: string): Promise<void> {
    if (await this.applyQueryThroughUI(query)) {
      return;
    }

    const url = new URL(location.href);
    if (query && query.trim()) {
      url.searchParams.set('query', query.trim());
    } else {
      url.searchParams.delete('query');
    }
    location.assign(url.toString());
  }

  private async applyQueryThroughUI(query: string): Promise<boolean> {
    const input = this.getQueryAssistInputElement();

    if (!input) {
      return false;
    }

    const normalizedQuery = query.trim();

    input.focus();
    this.replaceContentEditableText(input, normalizedQuery);
    this.dispatchQueryInputEvents(input, normalizedQuery);

    await this.waitForUiTick();
    this.dispatchEnterKey(input);

    return true;
  }

  public toggleFilterInQuery(currentQuery: string, filterQuery: string): string {
    const normalizedFilterQuery = filterQuery.trim();

    if (!normalizedFilterQuery) {
      return currentQuery.trim();
    }

    const matchedIndices = this.findMatchingClauseIndices(currentQuery, filterQuery);

    if (matchedIndices.length > 0) {
      const currentClauses = this.extractConjunctiveClauses(currentQuery);
      const nextClauses = currentClauses
        .filter((_, index) => !matchedIndices.includes(index))
        .map((clause) => clause.raw.trim())
        .filter(Boolean);

      return nextClauses.join(' AND ');
    }

    const trimmedCurrentQuery = currentQuery.trim();
    if (!trimmedCurrentQuery) {
      return normalizedFilterQuery;
    }

    const normalizedCurrentQuery = this.hasTopLevelOr(this.unwrapOuterParentheses(trimmedCurrentQuery))
      && !this.isWrappedExpression(trimmedCurrentQuery)
      ? `(${trimmedCurrentQuery})`
      : trimmedCurrentQuery;

    return `${normalizedCurrentQuery} AND (${normalizedFilterQuery})`;
  }

  public getActiveFilterIndices(filters: Filter[], currentQuery: string): Set<number> {
    const activeIndices = new Set<number>();

    filters.forEach((filter, index) => {
      if (this.isFilterActive(currentQuery, filter.query)) {
        activeIndices.add(index);
      }
    });

    return activeIndices;
  }

  public isFilterActive(currentQuery: string, filterQuery: string): boolean {
    return this.findMatchingClauseIndices(currentQuery, filterQuery).length > 0;
  }

  public getQueryAssistInputElement(): HTMLElement | null {
    const selectors = [
      '[data-test="ring-query-assist-input"][contenteditable="true"]',
      'search-query-panel [contenteditable="true"][role="textbox"]',
      'rg-query-assist [contenteditable="true"][role="textbox"]'
    ];

    for (const selector of selectors) {
      const input = document.querySelector<HTMLElement>(selector);
      if (input) {
        return input;
      }
    }

    return null;
  }

  private replaceContentEditableText(element: HTMLElement, text: string): void {
    const selection = window.getSelection();
    const range = document.createRange();

    element.focus();

    if (typeof document.execCommand === 'function') {
      try {
        document.execCommand('selectAll', false);
        document.execCommand('insertText', false, text);
      } catch {
        element.textContent = text;
      }
    } else {
      element.textContent = text;
    }

    if (!selection) {
      return;
    }

    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private findMatchingClauseIndices(currentQuery: string, filterQuery: string): number[] {
    const currentClauses = this.extractConjunctiveClauses(currentQuery);
    if (currentClauses.length === 0) {
      return [];
    }

    const normalizedFilterQuery = this.normalizeClause(filterQuery);
    const exactMatchIndex = currentClauses.findIndex((clause) => clause.normalized === normalizedFilterQuery);

    if (exactMatchIndex >= 0) {
      return [exactMatchIndex];
    }

    const filterClauses = this.extractConjunctiveClauses(filterQuery);
    if (filterClauses.length === 0) {
      return [];
    }

    const matchedIndices: number[] = [];
    const usedIndices = new Set<number>();

    for (const filterClause of filterClauses) {
      const matchedIndex = currentClauses.findIndex((currentClause, index) => {
        return !usedIndices.has(index) && currentClause.normalized === filterClause.normalized;
      });

      if (matchedIndex === -1) {
        return [];
      }

      usedIndices.add(matchedIndex);
      matchedIndices.push(matchedIndex);
    }

    return matchedIndices;
  }

  private extractConjunctiveClauses(query: string): QueryClause[] {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return [];
    }

    const unwrappedQuery = this.unwrapOuterParentheses(trimmedQuery);
    if (this.hasTopLevelOr(unwrappedQuery)) {
      return [this.createClause(trimmedQuery)];
    }

    const explicitAndParts = this.splitTopLevelByOperator(unwrappedQuery, 'and');
    const rawParts = explicitAndParts.length > 0 ? explicitAndParts : [unwrappedQuery];
    const clauses = rawParts.flatMap((part) => this.extractImplicitClauses(part.trim()));

    return clauses.length > 0 ? clauses : [this.createClause(trimmedQuery)];
  }

  private extractImplicitClauses(query: string): QueryClause[] {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return [];
    }

    if (this.isWrappedExpression(trimmedQuery)) {
      return [this.createClause(trimmedQuery)];
    }

    const tokens = this.tokenizeTopLevel(trimmedQuery);
    const clauses: QueryClause[] = [];

    for (let index = 0; index < tokens.length;) {
      const attributeInfo = this.findAttributeAt(tokens, index);

      if (!attributeInfo) {
        clauses.push(this.createClause(tokens[index]));
        index += 1;
        continue;
      }

      const { endIndex, attributeName } = attributeInfo;
      let valueEndIndex = endIndex + 1;

      if (!this.openEndedAttributes.has(attributeName)) {
        while (valueEndIndex < tokens.length && !this.findAttributeAt(tokens, valueEndIndex)) {
          valueEndIndex += 1;
        }
      } else {
        valueEndIndex = tokens.length;
      }

      clauses.push(this.createClause(tokens.slice(index, valueEndIndex).join(' ')));
      index = valueEndIndex;
    }

    return clauses;
  }

  private findAttributeAt(tokens: string[], startIndex: number): { endIndex: number; attributeName: string } | null {
    const maxAttributeTokens = Math.min(tokens.length, startIndex + 5);

    for (let index = startIndex; index < maxAttributeTokens; index += 1) {
      if (!this.isPotentialAttributeNameToken(tokens[index])) {
        break;
      }

      if (tokens[index].endsWith(':')) {
        const attributeTokens = tokens
          .slice(startIndex, index + 1)
          .map((token) => token.replace(/:$/, ''));

        return {
          endIndex: index,
          attributeName: attributeTokens.join(' ').toLowerCase()
        };
      }
    }

    return null;
  }

  private isPotentialAttributeNameToken(token: string): boolean {
    if (!token) {
      return false;
    }

    if (this.isWrappedExpression(token) || token.startsWith('"') || token.startsWith('{')) {
      return false;
    }

    if (token.startsWith('#') || token.startsWith('-#') || token.startsWith('-"')) {
      return false;
    }

    return /^[\p{L}\p{N}_.-]+:?$/u.test(token);
  }

  private splitTopLevelByOperator(query: string, operator: 'and' | 'or'): string[] {
    const parts: string[] = [];
    let startIndex = 0;
    let depthParen = 0;
    let depthBrace = 0;
    let inQuotes = false;

    for (let index = 0; index < query.length; index += 1) {
      const char = query[index];
      const previousChar = query[index - 1];

      if (char === '"' && previousChar !== '\\') {
        inQuotes = !inQuotes;
        continue;
      }

      if (inQuotes) {
        continue;
      }

      if (char === '{') {
        depthBrace += 1;
        continue;
      }

      if (char === '}') {
        depthBrace = Math.max(0, depthBrace - 1);
        continue;
      }

      if (depthBrace > 0) {
        continue;
      }

      if (char === '(') {
        depthParen += 1;
        continue;
      }

      if (char === ')') {
        depthParen = Math.max(0, depthParen - 1);
        continue;
      }

      if (depthParen > 0) {
        continue;
      }

      if (!this.matchesOperatorAt(query, index, operator)) {
        continue;
      }

      const part = query.slice(startIndex, index).trim();
      if (part) {
        parts.push(part);
      }

      startIndex = index + operator.length;
      index += operator.length - 1;
    }

    const tail = query.slice(startIndex).trim();
    if (tail) {
      parts.push(tail);
    }

    return parts;
  }

  private matchesOperatorAt(query: string, index: number, operator: 'and' | 'or'): boolean {
    const chunk = query.slice(index, index + operator.length).toLowerCase();
    if (chunk !== operator) {
      return false;
    }

    const beforeChar = query[index - 1];
    const afterChar = query[index + operator.length];

    return this.isOperatorBoundary(beforeChar) && this.isOperatorBoundary(afterChar);
  }

  private isOperatorBoundary(char: string | undefined): boolean {
    return char === undefined || /\s|\(|\)/.test(char);
  }

  private hasTopLevelOr(query: string): boolean {
    const parts = this.splitTopLevelByOperator(query, 'or');
    return parts.length > 1;
  }

  private tokenizeTopLevel(query: string): string[] {
    const tokens: string[] = [];
    let currentToken = '';
    let depthParen = 0;
    let depthBrace = 0;
    let inQuotes = false;

    for (let index = 0; index < query.length; index += 1) {
      const char = query[index];
      const previousChar = query[index - 1];

      if (char === '"' && previousChar !== '\\') {
        currentToken += char;
        inQuotes = !inQuotes;
        continue;
      }

      if (!inQuotes) {
        if (char === '{') {
          depthBrace += 1;
        } else if (char === '}') {
          depthBrace = Math.max(0, depthBrace - 1);
        } else if (char === '(') {
          depthParen += 1;
        } else if (char === ')') {
          depthParen = Math.max(0, depthParen - 1);
        }
      }

      if (!inQuotes && depthParen === 0 && depthBrace === 0 && /\s/.test(char)) {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
        continue;
      }

      currentToken += char;
    }

    if (currentToken) {
      tokens.push(currentToken);
    }

    return tokens;
  }

  private normalizeClause(query: string): string {
    return this.unwrapOuterParentheses(query.trim())
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  private createClause(raw: string): QueryClause {
    return {
      raw,
      normalized: this.normalizeClause(raw)
    };
  }

  private unwrapOuterParentheses(query: string): string {
    let result = query.trim();

    while (this.isWrappedExpression(result)) {
      result = result.slice(1, -1).trim();
    }

    return result;
  }

  private isWrappedExpression(query: string): boolean {
    const trimmedQuery = query.trim();

    if (!trimmedQuery.startsWith('(') || !trimmedQuery.endsWith(')')) {
      return false;
    }

    let depth = 0;
    let depthBrace = 0;
    let inQuotes = false;

    for (let index = 0; index < trimmedQuery.length; index += 1) {
      const char = trimmedQuery[index];
      const previousChar = trimmedQuery[index - 1];

      if (char === '"' && previousChar !== '\\') {
        inQuotes = !inQuotes;
        continue;
      }

      if (inQuotes) {
        continue;
      }

      if (char === '{') {
        depthBrace += 1;
        continue;
      }

      if (char === '}') {
        depthBrace = Math.max(0, depthBrace - 1);
        continue;
      }

      if (depthBrace > 0) {
        continue;
      }

      if (char === '(') {
        depth += 1;
      } else if (char === ')') {
        depth -= 1;
      }

      if (depth === 0 && index < trimmedQuery.length - 1) {
        return false;
      }
    }

    return depth === 0;
  }

  private normalizeUiQueryText(text: string): string {
    return text.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private dispatchQueryInputEvents(element: HTMLElement, text: string): void {
    element.dispatchEvent(new InputEvent('beforeinput', {
      bubbles: true,
      cancelable: true,
      data: text,
      inputType: 'insertText'
    }));

    element.dispatchEvent(new InputEvent('input', {
      bubbles: true,
      data: text,
      inputType: 'insertText'
    }));

    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  private dispatchEnterKey(element: HTMLElement): void {
    const keyboardEventInit: KeyboardEventInit = {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    };

    element.dispatchEvent(new KeyboardEvent('keydown', keyboardEventInit));
    element.dispatchEvent(new KeyboardEvent('keypress', keyboardEventInit));
    element.dispatchEvent(new KeyboardEvent('keyup', keyboardEventInit));
  }

  private async waitForUiTick(): Promise<void> {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }

}
