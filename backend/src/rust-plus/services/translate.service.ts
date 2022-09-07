import { Injectable } from '@nestjs/common';
import { I18nService, TranslateOptions } from 'nestjs-i18n';

@Injectable()
export class TranslationService {
  constructor(private readonly i18n: I18nService) {}

  async translate(
    key: string,
    options: TranslateOptions = {
      lang: 'ru',
    },
  ): Promise<string> {
    if (options.args) {
      options.lang = 'ru';
    }
    return this.i18n.translate(key, options);
  }
}
