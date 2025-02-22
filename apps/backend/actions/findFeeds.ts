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
  // TODO: In addition to checking the site_url, play with the URL to check whether eg. the
  // site was previously accessible via http://, but now only https:// works. Or similar case
  // with the trailing forward slashes, www, etc.
  responseFetch,
  youTubeFinder,
  directFinder,
  webpageFinder,
  redirectPage,
]

export const findFeeds = createWorkflow<FoundFeeds>(processors)
