import { preflightFetch } from '../processors/common/preflightFetch'
import { responseFetch } from '../processors/common/responseFetch'
import { directFinder } from '../processors/finders/directFinder'
import { webpageFinder } from '../processors/finders/webpageFinder'
import { youTubeFinder } from '../processors/finders/youTubeFinder'
import { FeedInfo } from '../types/schemas'
import { createWorkflow, WorkflowProcessor } from './createWorkflow'

export type FindFeedsData = Array<FeedInfo>

export type FindFeedsProcessor = WorkflowProcessor<FindFeedsData>

export const processors: Array<FindFeedsProcessor> = [
    preflightFetch,
    responseFetch,
    youTubeFinder,
    directFinder,
    webpageFinder,
]

export const findFeeds = createWorkflow<FindFeedsData>(processors)
