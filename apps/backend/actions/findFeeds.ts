import { createWorkflow, type WorkflowProcessor } from '../helpers/workflows.js'
import { preflightFetch } from '../processors/common/preflightFetch.js'
import { responseFetch } from '../processors/common/responseFetch.js'
import { directFinder } from '../processors/finders/directFinder.js'
import { linkFinder } from '../processors/finders/linkFinder.js'
import { redirectPage } from '../processors/finders/redirectPage.js'
import { webpageFinder } from '../processors/finders/webpageFinder.js'
import { youTubeFinder } from '../processors/finders/youTubeFinder.js'
import type { FoundFeeds } from '../types/schemas.js'

export type FindFeedsProcessor = WorkflowProcessor<FoundFeeds>

export const findFeeds = createWorkflow<FoundFeeds>([
  preflightFetch('lastFixCheckEtag', 'lastFixCheckedAt'),
  // TODO: In addition to checking the site_url, play with the URL to check whether eg. the
  // site was previously accessible via http://, but now only https:// works. Or similar case
  // with the trailing forward slashes, www, etc.
  responseFetch,
  youTubeFinder,
  directFinder,
  webpageFinder,
  linkFinder,
  redirectPage,
])
