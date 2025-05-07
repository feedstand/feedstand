import { createWorkflow, type WorkflowProcessor } from '../helpers/workflows.ts'
import { failedPage } from '../processors/common/failedPage.ts'
import { guardedPage } from '../processors/common/guardedPage.ts'
import { preflightFetch } from '../processors/common/preflightFetch.ts'
import { responseFetch } from '../processors/common/responseFetch.ts'
import { atomFeed } from '../processors/fetchers/atomFeed.ts'
import { invalidFeed } from '../processors/fetchers/invalidFeed.ts'
import { jsonFeed } from '../processors/fetchers/jsonFeed.ts'
import { rdfFeed } from '../processors/fetchers/rdfFeed.ts'
import { redirectPage } from '../processors/fetchers/redirectPage.ts'
import { rssFeed } from '../processors/fetchers/rssFeed.ts'
import { soundCloudFeed } from '../processors/fetchers/soundCloudFeed.ts'
import type { FeedData } from '../types/schemas.ts'

export type FetchFeedProcessor = WorkflowProcessor<FeedData>

export const fetchFeed = createWorkflow<FeedData>([
  preflightFetch('lastScanEtag', 'lastScannedAt'),
  responseFetch,
  soundCloudFeed,
  rssFeed,
  atomFeed,
  jsonFeed,
  rdfFeed,
  redirectPage,
  guardedPage,
  invalidFeed,
  failedPage,
])
