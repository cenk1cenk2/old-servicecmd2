export function uniqueArrayFilter (value: any, index: number, self: any[]): boolean {
  return self.indexOf(value) === index
}

export function nullArrayValueFilter (value: any): boolean {
  return typeof value !== 'undefined'
}
