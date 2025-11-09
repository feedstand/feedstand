import { createWorkflow, type WorkflowProcessor } from '../helpers/workflows.ts'
import { failedPage } from '../processors/common/failedPage.ts'
import { guardedPage } from '../processors/common/guardedPage.ts'
import { preflightFetch } from '../processors/common/preflightFetch.ts'
import { preflightRateLimit } from '../processors/common/preflightRateLimit.ts'
import { rateLimitedPage } from '../processors/common/rateLimitedPage.ts'
import { redirectPage } from '../processors/common/redirectPage.ts'
import { responseFetch } from '../processors/common/responseFetch.ts'
import { atomFeed } from '../processors/fetchers/atomFeed.ts'
import { invalidFeed } from '../processors/fetchers/invalidFeed.ts'
import { jsonFeed } from '../processors/fetchers/jsonFeed.ts'
import { rdfFeed } from '../processors/fetchers/rdfFeed.ts'
import { rssFeed } from '../processors/fetchers/rssFeed.ts'
import { soundCloudFeed } from '../processors/fetchers/soundCloudFeed.ts'
import type { FeedData } from '../types/schemas.ts'

export type FetchFeedProcessor = WorkflowProcessor<FeedData>

export const fetchFeed = createWorkflow<FeedData>([
  preflightRateLimit,
  preflightFetch('lastScanEtag', 'lastScannedAt'),
  responseFetch,
  rateLimitedPage,
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
