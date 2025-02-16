import { WorkflowProcessor } from '../../actions/createWorkflow'

const signatures = [
    // Example: https://dogbiscuitphotos.com/feed/
    // Example: https://ninaubhi.com/blog/feed/
    // Related: https://www.siteground.co.uk/kb/seeing-captcha-website/
    { text: '.well-known/sgcaptcha', status: 202, name: 'SiteGround' },
    { text: '.well-known/captcha', status: 202, name: 'SiteGround' },

    // Example: https://www.viovet.co.uk/blog.rss
    // Related: https://openrss.org/issue/144
    // Related: https://developers.cloudflare.com/bots/reference/verified-bots-policy/
    // Related: https://radar.cloudflare.com/traffic/verified-bots
    // Header: "server: cloudflare"
    { text: '<title>Just a moment...</title>', status: 403, name: 'Cloudflare' },

    // Example: https://medzpills.com/feed/
    // Header: "panel: hpanel"
    // Header: "platform: hostinger"
    // Header: "server: LiteSpeed"
    { text: '.lsrecap/recaptcha', status: 200, name: 'Unknown' },
    { text: 'https://www.recaptcha.net', status: 200, name: 'Unknown' },
    { text: 'Verifying that you are not a robot...', status: 200, name: 'Unknown' },
]

export const guardedPage: WorkflowProcessor<unknown> = async (context, next) => {
    if (!context.response) {
        return await next()
    }

    const text = await context.response.text()
    const status = context.response.status

    for (const signature of signatures) {
        if (text.includes(signature.text) && status === signature.status) {
            throw new Error(`Guarded page, signature: ${signature.name}`)
        }
    }

    await next()
}
