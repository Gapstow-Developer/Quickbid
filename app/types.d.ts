interface Window {
  google: {
    maps: {
      places: {
        Autocomplete: new (
          input: HTMLInputElement,
          options?: {
            componentRestrictions?: { country: string }
            fields?: string[]
            types?: string[]
          },
        ) => {
          addListener: (event: string, callback: () => void) => void
          getPlace: () => {
            formatted_address?: string
            address_components?: any[]
            geometry?: any
            name?: string
          }
        }
      }
    }
  }
}
