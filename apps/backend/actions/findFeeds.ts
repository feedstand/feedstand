import { createWorkflow, type WorkflowProcessor } from '../helpers/workflows.ts'
import { preflightFetch } from '../processors/common/preflightFetch.ts'
import { preflightRateLimit } from '../processors/common/preflightRateLimit.ts'
import { redirectPage } from '../processors/common/redirectPage.ts'
import { responseFetch } from '../processors/common/responseFetch.ts'
import { directFinder } from '../processors/finders/directFinder.ts'
import { linkFinder } from '../processors/finders/linkFinder.ts'
import { webpageFinder } from '../processors/finders/webpageFinder.ts'
import { wordpressFinder } from '../processors/finders/wordpressFinder.ts'
import { youTubeFinder } from '../processors/finders/youTubeFinder.ts'
import type { FoundFeeds } from '../types/schemas.ts'

export type FindFeedsProcessor = WorkflowProcessor<FoundFeeds>

export const findFeeds = createWorkflow<FoundFeeds>([
  preflightRateLimit,
  preflightFetch('lastFixCheckEtag', 'lastFixCheckedAt'),
  // TODO: In addition to checking the site_url, play with the URL to check whether eg. the
  // site was previously accessible via http://, but now only https:// works. Or similar case
  // with the trailing forward slashes, www, etc.
  responseFetch,
  youTubeFinder,
  wordpressFinder,
  directFinder,
  webpageFinder,
  linkFinder,
  redirectPage,
])
