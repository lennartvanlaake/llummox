
const ts = String.raw
export const scoutSchema = ts`
    type Element = {
      // short
      description: string,
      // any navigation links in this element
      links: string[]
    }
    type Template = {
      // must be unique
      name: string,
      navigation: Element | null,
      footer: Element | null,
      otherElements: Element[],
      // name of tempalte it inherits from. If all pages have the same nav, but only some pages have the same footer, describe nav in "base" and then inheritsFrom: "base" for the pages with same footer
      inheritsFrom: string | null
    }
    type StructureProperty = {
	// Used to render editing-widget in CMS for this structure
	type: "boolean" | "datetime" | "file" | "image" | "list" | "number" | "select" | "string" | "object" 
	description: string
    }
    type Structure = {
	properties: StructureProperty[]
    }
    type Page = {
      title: string,
      // relative to base
      url: string,
      // keep it short
      description: string,
      // true if all non-template elements can be described as md - simple page with content in central column. false if that is not the case: pages with repeating structures (grids of persons, lists of files, picture galaries etc)
      couldBeMarkdown: boolean,
      // refers to name of Template which is applicable to page
      templateName: string | null,
      // refers to name of Structure that is applicable on page. If structure = person, and this is a 'team' page with person cards, this should be ["person"]. Should always be [] when couldBeMarkdow is true.
      structures: string[]
    }
    type Schema = {
	templates: Template[],
	structures: Structure[],
 	pages: Page[]
    }
  `
export const resultOnly = ts`
    type Schema = {
	result: string
    }
  `




