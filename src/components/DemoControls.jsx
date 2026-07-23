import { useState } from 'react';
import { ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { writeFlag } from '../lib/getTwinData';

/**
 * Demo event triggers — one per patient.
 * Each trigger appends a synthetic event to the patient's local state.
 *
 * Script for the 3-click demo:
 *   1. "Trigger stable — Ngozi"    → confirms normal baseline check
 *   2. "Trigger watch — Emmanuel"  → shows card transition to watch, note appears
 *   3. "Trigger critical — Amara"  → card floats to top, critical flag, CHW note
 */
const DEMO_TRIGGERS = [
  {
    patientId: 'pt-003',
    label: 'Stable reading — Ngozi Eze',
    description: 'BP 114 mmHg (within range)',
    outcome: 'stable',
    event: {
      id: `demo-${Date.now()}-003`,
      code: '55284-4',
      system: 'cardiovascular',
      label: 'Blood Pressure (Systolic)',
      value: '114',
      unit: 'mmHg',
      occurredAt: new Date().toISOString(),
      baselineValue: '110',
      rangeMin: 90,
      rangeMax: 135,
      status: 'stable',
    },
    flagMessage: null,
  },
  {
    patientId: 'pt-002',
    label: 'Watch drift — Emmanuel Adeyemi',
    description: 'Glucose 122 mg/dL (above range)',
    outcome: 'watch',
    event: {
      id: `demo-${Date.now()}-002`,
      code: '2345-7',
      system: 'metabolic',
      label: 'Glucose',
      value: '122',
      unit: 'mg/dL',
      occurredAt: new Date().toISOString(),
      baselineValue: '98',
      rangeMin: 70,
      rangeMax: 110,
      status: 'watch',
    },
    flagMessage: 'Glucose rising — now third consecutive reading above personal baseline. Recommend dietary review.',
  },
  {
    patientId: 'pt-001',
    label: 'Critical drift — Amara Okafor',
    description: 'BP 158 mmHg (significantly elevated)',
    outcome: 'critical',
    event: {
      id: `demo-${Date.now()}-001`,
      code: '55284-4',
      system: 'cardiovascular',
      label: 'Blood Pressure (Systolic)',
      value: '158',
      unit: 'mmHg',
      occurredAt: new Date().toISOString(),
      baselineValue: '118',
      rangeMin: 90,
      rangeMax: 140,
      status: 'critical',
    },
    flagMessage: "Amara's BP has spiked to 158 mmHg — well above her personal baseline and HOLON reference range. Recommend same-day escalation.",
  },
];

/**
 * DemoControls — collapsible drawer for demo event triggers.
 * Visually separate from the real UI (dashed border + muted label).
 */
export default function DemoControls({ onTrigger }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(null);
  const [fired, setFired] = useState([]);

  async function handleTrigger(trigger) {
    setLoading(trigger.patientId);
    try {
      // Generate unique id for this demo event
      const ev = {
        ...trigger.event,
        id: `demo-${Date.now()}-${trigger.patientId}`,
        occurredAt: new Date().toISOString(),
      };

      // Write a flag (no-op in fixture mode, real write in live mode)
      if (trigger.flagMessage) {
        await writeFlag(trigger.patientId, ev.system, trigger.flagMessage);
      }

      onTrigger?.({ patientId: trigger.patientId, event: ev, flagMessage: trigger.flagMessage });
      setFired((prev) => [...prev, trigger.patientId]);
    } catch (err) {
      console.warn('Demo trigger error:', err);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="demo-controls-wrapper">
      {/* Toggle header */}
      <button
        id="demo-controls-toggle"
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="demo-controls-body"
      >
        <div className="flex items-center gap-2">
          <Zap size={13} style={{ color: '#5C6B68' }} />
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: '#5C6B68' }}
          >
            Demo Controls
          </span>
        </div>
        {open
          ? <ChevronUp size={14} style={{ color: '#5C6B68' }} />
          : <ChevronDown size={14} style={{ color: '#5C6B68' }} />
        }
      </button>

      {/* Body */}
      {open && (
        <div
          id="demo-controls-body"
          className="px-4 pb-4 space-y-2"
        >
          <p className="text-xs mb-3" style={{ color: '#5C6B68' }}>
            Click in order for the recorded demo: stable → watch → critical
          </p>
          {DEMO_TRIGGERS.map((trigger, i) => {
            const isLoading = loading === trigger.patientId;
            const wasFired = fired.includes(trigger.patientId);
            const outcomeColor =
              trigger.outcome === 'critical' ? '#D64545'
              : trigger.outcome === 'watch'   ? '#C8892A'
              : '#2E7D6A';

            return (
              <button
                key={trigger.patientId}
                id={`demo-trigger-${i + 1}`}
                onClick={() => handleTrigger(trigger)}
                disabled={isLoading}
                className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                style={{
                  backgroundColor: wasFired ? 'rgba(79,157,140,0.06)' : '#F7FAF9',
                  border: '1px solid #DCE6E3',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                <span
                  className="flex-shrink-0 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center mt-0.5 font-semibold"
                  style={{ backgroundColor: outcomeColor, fontSize: '9px' }}
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium" style={{ color: '#12211F' }}>
                    {isLoading ? 'Triggering…' : trigger.label}
                  </p>
                  <p className="text-xs" style={{ color: '#5C6B68' }}>
                    {trigger.description}
                  </p>
                </div>
                {wasFired && (
                  <span className="ml-auto text-xs flex-shrink-0" style={{ color: '#4F9D8C' }}>
                    ✓ fired
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
