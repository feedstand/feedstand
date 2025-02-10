import { failedPage } from '../processors/common/failedPage'
import { guardedPage } from '../processors/common/guardedPage'
import { preflightFetch } from '../processors/common/preflightFetch'
import { responseFetch } from '../processors/common/responseFetch'
import { invalidFeed } from '../processors/fetchers/invalidFeed'
import { jsonFeed } from '../processors/fetchers/jsonFeed'
import { redirectFeed } from '../processors/fetchers/redirectFeed'
import { soundCloudFeed } from '../processors/fetchers/soundCloudFeed'
import { xmlFeed } from '../processors/fetchers/xmlFeed'
import { FeedData } from '../types/schemas'
import { createWorkflow, WorkflowProcessor } from './createWorkflow'

export type FetchFeedData = FeedData

export type FetchFeedProcessor = WorkflowProcessor<FetchFeedData>

export const processors: Array<FetchFeedProcessor> = [
    preflightFetch,
    responseFetch,
    soundCloudFeed,
    jsonFeed,
    xmlFeed,
    redirectFeed,
    guardedPage,
    invalidFeed,
    failedPage,
]

export const fetchFeed = createWorkflow<FetchFeedData>(processors)
