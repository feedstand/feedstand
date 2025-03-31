import { type WorkflowProcessor, createWorkflow } from '../helpers/workflows'
import { preflightFetch } from '../processors/common/preflightFetch'
import { responseFetch } from '../processors/common/responseFetch'
import { directFinder } from '../processors/finders/directFinder'
import { linkFinder } from '../processors/finders/linkFinder'
import { redirectPage } from '../processors/finders/redirectPage'
import { webpageFinder } from '../processors/finders/webpageFinder'
import { youTubeFinder } from '../processors/finders/youTubeFinder'
import type { FoundFeeds } from '../types/schemas'

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
