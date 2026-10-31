import type { Schema, Struct } from '@strapi/strapi';

export interface UseCaseItem extends Struct.ComponentSchema {
  collectionName: 'components_use_case_items';
  info: {
    description: 'Add, remove or reorder items. The site controls numbering.';
    displayName: 'Text item';
  };
  attributes: {
    content: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.CustomField<'global::limited-richtext'>;
  };
}

export interface UseCaseTopic extends Struct.ComponentSchema {
  collectionName: 'components_use_case_topics';
  info: {
    displayName: 'Topic';
  };
  attributes: {
    description: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.CustomField<'global::limited-richtext'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'use-case.item': UseCaseItem;
      'use-case.topic': UseCaseTopic;
    }
  }
}
