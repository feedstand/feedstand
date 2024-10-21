// If item pubDate is empty, fallback to current datetime.
// Example value: <empty string>.
// Example feed: https://www.apparelmusic.com/feed/.
export const dateEmptyNow = (value: unknown) => {
    if (!value) {
        return new Date()
    }
}
