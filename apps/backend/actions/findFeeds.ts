import { preflightFetch } from '../processors/common/preflightFetch'
import { responseFetch } from '../processors/common/responseFetch'
import { directFinder } from '../processors/finders/directFinder'
import { redirectPage } from '../processors/finders/redirectPage'
import { webpageFinder } from '../processors/finders/webpageFinder'
import { youTubeFinder } from '../processors/finders/youTubeFinder'
import { FoundFeeds } from '../types/schemas'
import { createWorkflow, WorkflowProcessor } from './createWorkflow'

export type FindFeedsProcessor = WorkflowProcessor<FoundFeeds>

export const processors: Array<FindFeedsProcessor> = [
    preflightFetch('lastFixCheckEtag', 'lastFixCheckedAt'),
    responseFetch,
    youTubeFinder,
    directFinder,
    webpageFinder,
    redirectPage,
]

export const findFeeds = createWorkflow<FoundFeeds>(processors)
