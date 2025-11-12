import { createWorkflow, type WorkflowProcessor } from '../helpers/workflows.ts'
import { conditionalFetch } from '../processors/common/conditionalFetch.ts'
import { failedPage } from '../processors/common/failedPage.ts'
import { guardedPage } from '../processors/common/guardedPage.ts'
import { preflightRateLimit } from '../processors/common/preflightRateLimit.ts'
import { rateLimitedPage } from '../processors/common/rateLimitedPage.ts'
import { redirectPage } from '../processors/common/redirectPage.ts'
import { atomFeed } from '../processors/fetchers/atomFeed.ts'
import { invalidFeed } from '../processors/fetchers/invalidFeed.ts'
import { jsonFeed } from '../processors/fetchers/jsonFeed.ts'
import { rdfFeed } from '../processors/fetchers/rdfFeed.ts'
import { rssFeed } from '../processors/fetchers/rssFeed.ts'
import { soundCloudFeed } from '../processors/fetchers/soundCloudFeed.ts'
import type { FeedData } from '../types/schemas.ts'
import type { FetchUrlOptions } from './fetchUrl.ts'

export type FetchFeedProcessor = WorkflowProcessor<FeedData, FetchUrlOptions>

export const fetchFeed = createWorkflow<FeedData, FetchUrlOptions>([
  preflightRateLimit,
  conditionalFetch('lastScanEtag', 'lastScanLastModified'),
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
