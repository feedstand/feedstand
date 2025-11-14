import { createWorkflow, type WorkflowProcessor } from '../helpers/workflows.ts'
import { conditionalFetch } from '../processors/common/conditionalFetch.ts'
import { preflightRateLimit } from '../processors/common/preflightRateLimit.ts'
import { redirectPage } from '../processors/common/redirectPage.ts'
import { directFinder } from '../processors/finders/directFinder.ts'
// import { linkFinder } from '../processors/finders/linkFinder.ts'
import { webpageHeadersFinder } from '../processors/finders/webpageHeadersFinder.ts'
import { webpageHtmlFinder } from '../processors/finders/webpageHtmlFinder.ts'
import { wordpressFinder } from '../processors/finders/wordpressFinder.ts'
import { youTubeFinder } from '../processors/finders/youTubeFinder.ts'
import type { FoundFeeds } from '../types/schemas.ts'

export type FindFeedsProcessor = WorkflowProcessor<FoundFeeds>

export const findFeeds = createWorkflow<FoundFeeds>([
  preflightRateLimit,
  conditionalFetch('lastFixCheckEtag', 'lastFixCheckLastModified'),
  // TODO: In addition to checking the site_url, play with the URL to check whether eg. the
  // site was previously accessible via http://, but now only https:// works. Or similar case
  // with the trailing forward slashes, www, etc.
  youTubeFinder,
  wordpressFinder,
  directFinder,
  webpageHeadersFinder,
  webpageHtmlFinder,
  // linkFinder,
  redirectPage,
])
