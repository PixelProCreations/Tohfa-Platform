import { describe, expect, it } from 'vitest';
import {
  FOLLOWUP_REQUIRED_OPTIONS,
  INITIAL_DISPUTES,
  RESOLUTION_OUTCOME_OPTIONS,
  TOHFA_RESPONSE_OPTIONS,
} from '../screens/dashboard/fixtures';

describe('FarmerDisputesMediationScreen data & structure', () => {
  it('contains exactly 6 initial dispute records matching screenshot specifications', () => {
    expect(INITIAL_DISPUTES).toHaveLength(6);
    const ids = INITIAL_DISPUTES.map((d) => d.id);
    expect(ids).toEqual([
      'DIS-2026-0042',
      'DIS-2026-0043',
      'DIS-2026-0044',
      'DIS-2026-0045',
      'DIS-2026-0046',
      'DIS-2026-0038',
    ]);
  });

  it('verifies exact fields and data content for each dispute from screenshots', () => {
    const d42 = INITIAL_DISPUTES.find((d) => d.id === 'DIS-2026-0042');
    expect(d42?.status).toBe('Under Review');
    expect(d42?.category).toBe('Payment & Payout');
    expect(d42?.title).toBe('Farmer rating question');
    expect(d42?.raisedBy).toBe('Ramesh Kumar');
    expect(d42?.otherParty).toBe('Procurement Team (TOHFA)');
    expect(d42?.createdDate).toBe('08 Oct 2026');
    expect(d42?.lastActivityDate).toBe('09 Oct 2026');

    const d43 = INITIAL_DISPUTES.find((d) => d.id === 'DIS-2026-0043');
    expect(d43?.status).toBe('Awaiting TOHFA');
    expect(d43?.title).toBe('Payment delay for accepted produce');
    expect(d43?.raisedBy).toBe('Meena');

    const d44 = INITIAL_DISPUTES.find((d) => d.id === 'DIS-2026-0044');
    expect(d44?.status).toBe('Open');
    expect(d44?.category).toBe('Purchase & Collection');
    expect(d44?.title).toBe('Collection delay at the Ooty centre');
    expect(d44?.raisedBy).toBe('Kumar');

    const d45 = INITIAL_DISPUTES.find((d) => d.id === 'DIS-2026-0045');
    expect(d45?.status).toBe('Open');
    expect(d45?.category).toBe('Purchase & Collection');
    expect(d45?.title).toBe('Transport cost deducted from payout');
    expect(d45?.raisedBy).toBe('Lakshmi');

    const d46 = INITIAL_DISPUTES.find((d) => d.id === 'DIS-2026-0046');
    expect(d46?.status).toBe('Escalated');
    expect(d46?.category).toBe('Produce Quality & Rejection');
    expect(d46?.title).toBe('Grade assigned to a produce listing');
    expect(d46?.raisedBy).toBe('Selvi');

    const d38 = INITIAL_DISPUTES.find((d) => d.id === 'DIS-2026-0038');
    expect(d38?.status).toBe('Resolved');
    expect(d38?.category).toBe('Audit & Documentation');
    expect(d38?.title).toBe('Audit report clarification');
    expect(d38?.raisedBy).toBe('Ramesh Kumar');
  });

  it('validates M10-S03 Dispute Timeline events and filter categories for DIS-2026-0042', () => {
    const d42 = INITIAL_DISPUTES.find((d) => d.id === 'DIS-2026-0042');
    expect(d42?.detailedTimeline).toBeDefined();
    expect(d42?.detailedTimeline).toHaveLength(5);

    const timeline = d42!.detailedTimeline!;

    // 1. All Activity: 5 events
    expect(timeline[0]).toMatchObject({
      type: 'status',
      title: 'Dispute submitted',
      description: 'Ramesh Kumar submitted a dispute about a payment.',
      author: 'Ramesh Kumar',
      timestamp: '08 Oct 2026, 09:12',
    });

    expect(timeline[1]).toMatchObject({
      type: 'evidence',
      title: 'Evidence added',
      description: 'Payment statement was attached.',
      author: 'Ramesh Kumar',
      timestamp: '08 Oct 2026, 09:14',
      attachmentTitle: 'Payment statement',
    });

    expect(timeline[2]).toMatchObject({
      type: 'evidence',
      title: 'Evidence added',
      description: 'Carrot batch photo was attached.',
      author: 'Ramesh Kumar',
      timestamp: '08 Oct 2026, 09:15',
      attachmentTitle: 'Carrot batch photo',
    });

    expect(timeline[3]).toMatchObject({
      type: 'status',
      title: 'Status changed to Under Review',
      description: 'The Farmer Admin started reviewing the dispute.',
      author: 'Suresh Kumar',
      timestamp: '09 Oct 2026, 10:05',
    });

    expect(timeline[4]).toMatchObject({
      type: 'note',
      title: 'Mediation note added',
      description: 'Mediation note recorded (internal).',
      author: 'Suresh Kumar',
      timestamp: '09 Oct 2026, 10:30',
    });

    // 2. Notes filter: 1 event
    const notesOnly = timeline.filter((e) => e.type === 'note');
    expect(notesOnly).toHaveLength(1);
    expect(notesOnly[0]!.title).toBe('Mediation note added');

    // 3. Evidence Updates filter: 2 events
    const evidenceOnly = timeline.filter((e) => e.type === 'evidence');
    expect(evidenceOnly).toHaveLength(2);
    expect(evidenceOnly[0]!.attachmentTitle).toBe('Payment statement');
    expect(evidenceOnly[1]!.attachmentTitle).toBe('Carrot batch photo');

    // 4. Status Changes filter: 2 events
    const statusOnly = timeline.filter((e) => e.type === 'status');
    expect(statusOnly).toHaveLength(2);
    expect(statusOnly[0]!.title).toBe('Dispute submitted');
    expect(statusOnly[1]!.title).toBe('Status changed to Under Review');
  });

  it('validates M10-S04 Dispute Resolution options from mockups', () => {
    expect(RESOLUTION_OUTCOME_OPTIONS).toEqual([
      'Select an outcome',
      'Resolved — Clarification Provided',
      'Resolved — Corrective Action Recorded',
      'Awaiting Farmer Information',
      'Awaiting TOHFA Response',
      'Escalated to TOHFA Admin',
      'Unable to Resolve — Further Review Required',
    ]);

    expect(TOHFA_RESPONSE_OPTIONS).toContain('No TOHFA response recorded');
    expect(FOLLOWUP_REQUIRED_OPTIONS).toContain('Select');
    expect(FOLLOWUP_REQUIRED_OPTIONS).toContain('None');
  });
});


