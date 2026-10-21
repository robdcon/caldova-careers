/**
 * Pure, side-effect-free helpers for working with job postings.
 *
 * These operate on plain `Job[]` arrays (already loaded from the content
 * collection by the calling page) so they can be unit tested without the Astro
 * content runtime or a database.
 */
import type { Job } from '../types/job';

/** Return jobs sorted by posted date, newest first (does not mutate input). */
export function sortByNewest(jobs: Job[]): Job[] {
    return [...jobs].sort(
        (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime(),
    );
}

/** Return the distinct department names in alphabetical order. */
export function getDepartments(jobs: Job[]): string[] {
    return getSortedUniqueValues(jobs.map((job) => job.department));
}

/** Return the distinct location names in alphabetical order. */
export function getLocations(jobs: Job[]): string[] {
    return getSortedUniqueValues(jobs.map((job) => job.location));
}

/** Narrow jobs by optional department and location criteria without mutating the input. */
export function filterJobs(
    jobs: Job[],
    filters: { department?: string; location?: string },
): Job[] {
    return jobs.filter(
        (job) =>
            (!filters.department || job.department === filters.department) &&
            (!filters.location || job.location === filters.location),
    );
}

/**
 * Format an ISO-8601 date as a human-readable posted date,
 * e.g. "January 5, 2027". Falls back to the raw value if unparseable.
 */
export function formatPostedDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return iso;
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
}

/** Return unique strings in locale-aware alphabetical order. */
function getSortedUniqueValues(values: string[]): string[] {
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}
