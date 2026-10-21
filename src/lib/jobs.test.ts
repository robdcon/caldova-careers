import { describe, it, expect } from 'vitest';
import {
    filterJobs,
    formatPostedDate,
    getDepartments,
    getLocations,
    sortByNewest,
} from './jobs';
import type { Job } from '../types/job';

function makeJob(
    slug: string,
    postedDate: string,
    department = 'Technology',
    location = 'Remote',
): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department,
        location,
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});

describe('role filtering', () => {
    const jobs = [
        makeJob('frontend', '2027-03-15', 'Technology', 'Remote'),
        makeJob('scientist', '2027-03-14', 'Clinical Research', 'Boston, MA'),
        makeJob('analyst', '2027-03-13', 'Finance', 'Remote'),
        makeJob('engineer', '2027-03-12', 'Technology', 'Boston, MA'),
    ];

    it('derives sorted unique departments and locations', () => {
        expect(getDepartments(jobs)).toEqual(['Clinical Research', 'Finance', 'Technology']);
        expect(getLocations(jobs)).toEqual(['Boston, MA', 'Remote']);
    });

    it('filters by department', () => {
        expect(filterJobs(jobs, { department: 'Technology' }).map((job) => job.slug)).toEqual([
            'frontend',
            'engineer',
        ]);
    });

    it('filters by location', () => {
        expect(filterJobs(jobs, { location: 'Remote' }).map((job) => job.slug)).toEqual([
            'frontend',
            'analyst',
        ]);
    });

    it('requires roles to match both filters', () => {
        expect(
            filterJobs(jobs, { department: 'Technology', location: 'Boston, MA' }).map(
                (job) => job.slug,
            ),
        ).toEqual(['engineer']);
    });

    it('returns all jobs when filters are cleared', () => {
        expect(filterJobs(jobs, {})).toEqual(jobs);
    });

    it('returns no jobs when no roles match the filters', () => {
        expect(filterJobs(jobs, { department: 'Finance', location: 'Boston, MA' })).toEqual([]);
    });
});
