import * as prompts from 'prompts'
import * as zxcvbn from 'zxcvbn'

export async function promptPassword(): Promise<string> {
  const input = await prompts([
    {
      type: 'password',
      name: 'password',
      message: 'Input password',
      validate: (value) => {
        const ret = zxcvbn(value)
        if (ret.score >= 2) {
          return true
        } else {
          return `${ret.feedback.warning} => ${ret.feedback.suggestions.join(
            ' ',
          )}`
        }
      },
    },
  ])
  return input.password
}
