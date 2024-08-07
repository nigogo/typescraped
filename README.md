# TypeScraped: Type-Safe, Configurable Web Scraping Utility

## Description

**TypeScraped** is a type-safe, schema-first web scraping utility designed with TypeScript in mind. With TypeScraped, you can define your scraping schema using TypeScript types, ensuring precise and type-safe data extraction from web pages. It's an ideal solution for developers seeking a robust and maintainable web scraping tool.

## Key Features

- **Schema-First Approach**: Define your data extraction schema using TypeScript types for type safety and consistency.
- **Attribute Handling**: Extract data from elements' attributes, with support for multiple fallback attributes to handle lazy-loaded content or varying data structures.
- **Regex Support**: Apply regular expressions to extracted data for further refinement and processing.
- **Meta Data Extraction**: Easily include meta information like the URL in your scraped data.
- **Nested Configurations**: Support for nested and array configurations to handle complex data structures within web pages.
- **Ease of Use**: Simple and intuitive configuration syntax, making it easy to set up and customize your scraping logic.
- **Flexible Input**: Scrape data from either a URL or an HTML string.

## Installation

Install TypeScraped via npm:

```bash
npm install typescraped
```

## Example Usage

Define your data structure and scraping configuration for an Anteater profile:

```typescript
import { ScraperConfig, Scraper, MetaValue } from 'typescraped';

export class FoodSource {
  type: string;
  quantity: number;
}

export class Anteater {
  name: string;
  profileUrl: string;
  description: string;
  foodSources: FoodSource[];
}

const scraperConfig: ScraperConfig<Anteater> = {
  name: { selector: 'h1.anteater-title' },
  profileUrl: { meta: MetaValue.URL },
  description: { selector: 'div.description', regex: /Anteater:\s*(.*)/ },
  foodSources: {
    selector: '.food-list > li',
    itemConfig: {
      type: { selector: '.food-type' },
      quantity: { selector: '.food-quantity', attribute: 'data-quantity', regex: /(\d+)/ }
    }
  }
};

const scraper = new Scraper<Anteater>(scraperConfig);

// Using a URL
scraper.scrape({ url: 'http://example.com/anteater-profile' }).then(result => {
  console.log('Scraped from URL:', result);
});

// Using an HTML string
const htmlString = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anteater Profile</title>
</head>
<body>
  <h1 class="anteater-title" data-name="Alex the Anteater">Alex the Anteater</h1>
  <div class="description">Anteater: A fascinating creature with a long snout and tongue.</div>
  <ul class="food-list">
    <li class="food-source">
      <span class="food-type" data-type="Ants">Ants</span>
      <span class="food-quantity" data-quantity="500">500 ants</span>
    </li>
    <li class="food-source">
      <span class="food-type" data-type="Termites">Termites</span>
      <span class="food-quantity" data-quantity="300">300 termites</span>
    </li>
  </ul>
</body>
</html>
`;

scraper.scrape({ html: htmlString }).then(result => {
  console.log('Scraped from HTML string:', result);
});
```

## API

### `ScraperConfig<T>`

A TypeScript type that defines the configuration for scraping data of type `T`. Supports nested configurations, arrays, attributes, and regex.

### `Scraper<T>`

A class that takes a `ScraperConfig<T>` and provides a method `scrape({ url, html }: { url?: string; html?: string }): Promise<T>` to scrape data from the given URL or HTML string according to the schema.

## Note

This is an early version and may not be production-ready. Contributions and feature requests are not encouraged at this stage.

## License

TypeScraped is released under the MIT License.