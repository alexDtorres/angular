/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {ɵMessageId, ɵParsedTranslation, ɵparseTranslation} from '@angular/localize';
import {extname} from 'path';
import {Diagnostics} from '../../../diagnostics';

import {ParseAnalysis, ParsedTranslationBundle, TranslationParser} from './translation_parser';

/**
 * A translation parser that can parse JSON that has the form:
 *
 * ```
 * {
 *   "locale": "...",
 *   "translations": {
 *     "message-id": "Target message string",
 *     ...
 *   }
 * }
 * ```
 *
 * @see SimpleJsonTranslationSerializer
 */
export class SimpleJsonTranslationParser implements TranslationParser<Object> {
  /**
   * @deprecated
   */
  canParse(filePath: string, contents: string): Object|false {
    const result = this.analyze(filePath, contents);
    return result.canParse && result.hint;
  }

  analyze(filePath: string, contents: string): ParseAnalysis<Object> {
    const diagnostics = new Diagnostics();
    if (extname(filePath) !== '.json') {
      diagnostics.warn('File does not have .json extension.');
      return {canParse: false, diagnostics};
    }
    try {
      const json = JSON.parse(contents);
      if (json.locale === undefined) {
        diagnostics.warn('Required "locale" property missing.');
        return {canParse: false, diagnostics};
      }
      if (typeof json.locale !== 'string') {
        diagnostics.warn('The "locale" property is not a string.');
        return {canParse: false, diagnostics};
      }
      if (json.translations === undefined) {
        diagnostics.warn('Required "translations" property missing.');
        return {canParse: false, diagnostics};
      }
      if (typeof json.translations !== 'object') {
        diagnostics.warn('The "translations" is not an object.');
        return {canParse: false, diagnostics};
      }
      return {canParse: true, diagnostics, hint: json};
    } catch (e) {
      diagnostics.warn('File is not valid JSON.');
      return {canParse: false, diagnostics};
    }
  }

  parse(_filePath: string, contents: string, json?: Object): ParsedTranslationBundle {
    const {locale: parsedLocale, translations} = json || JSON.parse(contents);
    const parsedTranslations: Record<ɵMessageId, ɵParsedTranslation> = {};
    for (const messageId in translations) {
      const targetMessage = translations[messageId];
      parsedTranslations[messageId] = ɵparseTranslation(targetMessage);
    }
    return {locale: parsedLocale, translations: parsedTranslations, diagnostics: new Diagnostics()};
  }
}
