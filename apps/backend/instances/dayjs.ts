import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(timezone)
dayjs.tz.setDefault('UTC')

export { dayjs }
