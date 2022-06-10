import {
  CreateDateColumn,
  PrimaryGeneratedColumn,
  Repository,
  UpdateDateColumn,
} from 'typeorm'
import {
  adjectives,
  animals,
  colors,
  Config,
  uniqueNamesGenerator,
} from 'unique-names-generator'
import { ObjectLiteral } from 'typeorm/common/ObjectLiteral'
import { BigNumber } from 'ethers'

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}

export function transformerForBigNumber() {
  return {
    from: (value?: string) => (value ? BigNumber.from(value) : null),
    to: (value?: BigNumber): any => (value ? value.toString() : null),
  }
}

export async function generateName<Entity extends ObjectLiteral>(
  repo: Repository<Entity>,
): Promise<string> {
  const cfg: Config = {
    dictionaries: [adjectives, colors, animals],
    separator: '-',
  }
  const name = uniqueNamesGenerator(cfg)
  if (!(await repo.findOne({ name } as any))) {
    return name
  }
  for (let num = 1; ; num++) {
    const nameNum = `${name}-${num}`
    if (!(await repo.findOne({ name } as any))) {
      return nameNum
    }
  }
}
