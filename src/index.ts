import axios from "axios";
import * as cheerio from "cheerio";
import { AnyNode, Cheerio, CheerioAPI } from "cheerio";

type ScraperItemConfig<T> = {
  selector: string;
  attribute?: string | string[];
  regex?: RegExp;
  meta?: never;
  itemConfig: ScraperConfig<T>;
};

type ScraperPrimitiveConfig = {
  selector: string;
  attribute?: string | string[];
  regex?: RegExp;
  meta?: never;
  itemConfig?: never;
};

type ScraperMetaConfig = {
  selector?: never;
  attribute?: never;
  regex?: never;
  meta?: MetaValue;
  itemConfig?: never;
};

export type ScraperConfig<T> = {
  [K in keyof T]: T[K] extends Array<infer U>
    ? ScraperItemConfig<U>
    : T[K] extends object
      ? ScraperConfig<T[K]>
      : ScraperPrimitiveConfig | ScraperMetaConfig;
};

export enum MetaValue {
  URL,
}

export class Scraper<T> {
  constructor(private config: ScraperConfig<T>) {}

  async scrape({ url, html }: { url?: string; html?: string }): Promise<T> {
    if ((url && html) || (!url && !html)) {
      throw new Error("Provide either a URL or an HTML string, but not both.");
    }

    let data: string;

    if (url) {
      const response = await axios.get(url);
      data = response.data;
    } else if (html) {
      data = html;
    } else {
      throw new Error("Provide either a URL or an HTML string.");
    }

    const $ = cheerio.load(data);
    const property = this.scrapeObject<T>(this.config, $, url) as T;

    return property;
  }

  private scrapeObject<U>(
    config: ScraperConfig<U>,
    $: CheerioAPI,
    url: string,
  ): U {
    const result = {} as U;

    for (const key in config) {
      if (Object.prototype.hasOwnProperty.call(config, key)) {
        const valueConfig = config[key];

        if (this.isMetaValueConfig(valueConfig)) {
          (result as unknown)[key] = this.getMetaValue(valueConfig.meta, url);
        } else if (this.isArrayConfig(valueConfig)) {
          const items = this.scrapeArray(valueConfig, $);
          (result as unknown as U)[key] = items as U[Extract<keyof U, string>];
        } else if (this.isSelectorConfig(valueConfig)) {
          try {
            let value = this.extractValue(
              $(valueConfig.selector),
              valueConfig.attribute,
            );
            if (valueConfig.regex) {
              const match = value.match(valueConfig.regex);
              value = match ? match[1] : "";
            }
            (result as unknown)[key] = this.parseValue(key, value);
          } catch (e) {
            console.error(e);
          }
        } else if (typeof valueConfig === "object") {
          (result as unknown)[key] = this.scrapeObject(
            valueConfig as ScraperConfig<unknown>,
            $,
            url,
          );
        }
      }
    }

    return result;
  }

  private scrapeArray<U>(config: ScraperItemConfig<U>, $: CheerioAPI): U[] {
    const elements = $(config.selector).toArray();
    console.log(`Found ${elements.length} elements for ${config.selector}`);
    return elements.map((el) =>
      this.scrapeObject(config.itemConfig, cheerio.load(el), ""),
    );
  }

  private extractValue(
    $: Cheerio<AnyNode>,
    attribute?: string | string[],
  ): string {
    if (attribute) {
      const attributes = Array.isArray(attribute) ? attribute : [attribute];
      for (const attr of attributes) {
        const value = $.attr(attr)?.trim();
        if (value) {
          return value;
        }
      }
    }
    return $.text().trim();
  }

  private parseValue(key: string, value: string): unknown {
    const propertyKey = key as keyof T;

    const propertyValue = (this.config as unknown)[propertyKey];

    if (typeof propertyValue === "number") {
      return parseFloat(value.replace(/[^0-9.-]+/g, ""));
    } else if (typeof propertyValue === "boolean") {
      return value.toLowerCase() === "true" || value === "1";
    } else if (typeof propertyValue === "string") {
      return value;
    }
    return value;
  }

  private getMetaValue(meta: MetaValue, url: string): string {
    switch (meta) {
      case MetaValue.URL:
        return url;
      default:
        return "";
    }
  }

  private isArrayConfig(
    config: unknown,
  ): config is { selector: string; itemConfig: ScraperConfig<unknown> } {
    return (
      (config as { itemConfig: ScraperConfig<unknown> }).itemConfig !==
      undefined
    );
  }

  private isSelectorConfig(
    config: unknown,
  ): config is { selector: string; regex?: RegExp } {
    return (config as { selector: string }).selector !== undefined;
  }

  private isMetaValueConfig(config: unknown): config is { meta: MetaValue } {
    return (config as { meta: MetaValue }).meta !== undefined;
  }
}
