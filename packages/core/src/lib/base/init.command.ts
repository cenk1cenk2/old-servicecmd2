import Command from './base.command'
import { ObjectLiteral } from '@interfaces/object-literal.interface'
import { writeFile, readRaw } from '@utils/file-tools.util'

export default abstract class extends Command {
  private remove: boolean
  abstract baseFile: string
  abstract append: boolean

  async run (): Promise<void> {
    const { flags }: { flags: ObjectLiteral } = this.parse()

    // set variables from flags imported
    this.remove = flags?.remove

    // create init docker compose file
    this.tasks.add([
      {
        title: 'Clearing out comments.',
        enabled: (): boolean => flags['no-comment'],
        task: (ctx, task): void => {
          this.baseFile = this.removeComments(this.baseFile)
          task.title = 'No comments will be added to generated file.'
        }
      },
      {
        title: 'Checking template already appended to file.',
        enabled: (): boolean => this.append || this.remove,
        task: async (ctx): Promise<void> => {
          try {
            ctx.file = await readRaw(flags.dump)

            // if any one of them is not appended this will drop to false
            ctx.alreadyAppended = true
            await Promise.all(
              this.baseFile.split('\n').map(async (line) => {
                const testRegex = new RegExp(line.replace(/[.*!]/g, '.'), 'mig')
                if (!testRegex.test(ctx.file)) {
                  ctx.alreadyAppended = false
                }
              })
            )
          } catch {
            // file does not exists change it to non-append mode
            this.append = false
          }
        }
      },
      {
        title: 'Removing template as desired.',
        enabled: (ctx): boolean => this.remove && ctx.file,
        task: async (ctx): Promise<void> => {
          this.append = false

          await Promise.all(
            this.baseFile.split('\n').map(async (line) => {
              if (line !== '') {
                const testRegex = new RegExp(`${line.replace(/[.*!]/g, '.')}(\n|\r|\r\n)?`, 'mig')
                ctx.file = ctx.file.replace(testRegex, '')
              }
            })
          )
        }
      },
      {
        title: `Writing "${flags.dump}".`,
        enabled: (ctx): boolean => ctx.alreadyAppended !== true || this.remove,
        task: async (ctx, task): Promise<void> => {
          try {
            // for removing use the prereaded file
            let file: string
            if (this.remove) {
              file = ctx.file
            } else {
              file = this.baseFile
            }

            await writeFile(flags.dump, file, this?.append, false)
            task.title = `Generated "${flags.dump}".`
          } catch (e) {
            throw new Error(e)
          }
        }
      }
    ])
  }

  private removeComments (data: string): string {
    let parsedData = data.split('\n')
    parsedData = parsedData.map((line) => {
      return !line.match(/.*#.*/) ? line : null
    })

    parsedData = parsedData.filter((item) => item !== null)

    data = parsedData.join('\n')
    return data
  }
}
