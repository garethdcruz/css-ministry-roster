// src/App.js
import React, { useState, useEffect } from 'react';
import { CSVLink } from 'react-csv';
// ← Ministry constants
import { MINISTRIES, MINISTRY_OPTIONS } from './types';
import PersonForm from './components/PersonForm';
import RosterTable from './components/RosterTable';

// Hard-coded 13 weeks (1–6, Recess, 7–13)
const DEFAULT_WEEKS = [
  { id: 'wk1',  label: 'wk 1',         voided: false },
  { id: 'wk2',  label: 'wk 2',         voided: false },
  { id: 'wk3',  label: 'wk 3',         voided: false },
  { id: 'wk4',  label: 'wk 4',         voided: false },
  { id: 'wk5',  label: 'wk 5',         voided: false },
  { id: 'wk6',  label: 'wk 6',         voided: false },
  { id: 'mtr',  label: 'Recess (MTR)', voided: false },
  { id: 'wk7',  label: 'wk 7',         voided: false },
  { id: 'wk8',  label: 'wk 8',         voided: false },
  { id: 'wk9',  label: 'wk 9',         voided: false },
  { id: 'wk10', label: 'wk 10',        voided: false },
  { id: 'wk11', label: 'wk 11',        voided: false },
  { id: 'wk12', label: 'wk 12',        voided: false },
  { id: 'wk13', label: 'wk 13',        voided: false },
];

function App() {
  // ─── Ministry selector ────────────────────────────────────
  const [ministry, setMinistry] = useState('mass');
  const roles = MINISTRIES[ministry];

  // ─── Core state (people, weeks, assignments, exclusions) ────
  const [people, setPeople] = useState(() => {
    const st = JSON.parse(localStorage.getItem('roster') || '{}');
    return st.people || [];
  });
  const [weeks, setWeeks] = useState(DEFAULT_WEEKS);
  const [assignments, setAssignments] = useState(() => {
    const st = JSON.parse(localStorage.getItem('roster') || '{}');
    return st.assignments || [];
  });
  const [unavailable, setUnavailable] = useState(() => {
    const st = JSON.parse(localStorage.getItem('roster') || '{}');
    return st.unavailable || [];
  });

  // ─── Persist to localStorage ───────────────────────────────
  useEffect(() => {
    localStorage.setItem(
      'roster',
      JSON.stringify({ people, assignments, unavailable })
    );
  }, [people, assignments, unavailable]);

  // ─── Toggle a person-week exclusion ────────────────────────
  const toggleUnavailable = (pid, wid) => {
    const exists = unavailable.find(u => u.personId===pid && u.weekId===wid);
    if (exists) {
      setUnavailable(unavailable.filter(u => u!==exists));
    } else {
      setUnavailable([...unavailable, { personId: pid, weekId: wid }]);
    }
  };

  // ─── Include/exclude full week ─────────────────────────────
  const toggleVoided = wid => {
    setWeeks(weeks.map(w =>
      w.id === wid ? { ...w, voided: !w.voided } : w
    ));
  };

  // ─── Delete a person (and their data) ──────────────────────
  const removePerson = pid => {
    setPeople(people.filter(p => p.id !== pid));
    setAssignments(assignments.filter(a => a.personId !== pid));
    setUnavailable(unavailable.filter(u => u.personId !== pid));
  };

  const autoAssign = () => {
    const out = [];
    const personTotals = {};
    const baseTotals   = {};

    // Number of active (non-voided) weeks
    const totalWeeks = weeks.filter(w => !w.voided).length;

    // Initialize counts
    people.forEach(p => {
      personTotals[p.id] = 0;
      roles.forEach(r => {
        const base = r.replace(/\s*\d+$/, '');
        baseTotals[`${p.id}|${base}`] = 0;
      });
    });

    weeks.forEach((w, wIdx) => {
      if (w.voided) return;

      // Build list of available people
      let avail = people.filter(p =>
        !unavailable.some(u => u.personId === p.id && u.weekId === w.id)
      );
      if (!avail.length) return;

      // Shuffle & then sort by least-assigned overall
      avail.sort(() => Math.random() - 0.5)
          .sort((a, b) => personTotals[a.id] - personTotals[b.id]);

      // Determine who served last week, to avoid back-to-back
      const prevWeek = weeks[wIdx - 1];
      const prevAssigned = new Set();
      if (prevWeek && !prevWeek.voided) {
        out
          .filter(a => a.weekId === prevWeek.id)
          .forEach(a => prevAssigned.add(a.personId));
      }

      // Random rotation of the roles list
      const rot = Math.floor(Math.random() * roles.length);
      const pool = [...roles.slice(rot), ...roles.slice(0, rot)];

      // Assign one role per person
      avail.forEach(p => {
        if (!pool.length) return;

        // Compute cost for each remaining role
        let minCost = Infinity;
        pool.forEach(role => {
          const base = role.replace(/\s*\d+$/, '');
          // heavy penalty for repeats of same base-role
          let cost = personTotals[p.id] + baseTotals[`${p.id}|${base}`] * totalWeeks;
          // add back-to-back penalty if they served last week
          if (prevAssigned.has(p.id)) cost += totalWeeks * 2;
          minCost = Math.min(minCost, cost);
        });

        // Collect roles at that minimal cost
        const candidates = pool.filter(role => {
          const base = role.replace(/\s*\d+$/, '');
          let cost = personTotals[p.id] + baseTotals[`${p.id}|${base}`] * totalWeeks;
          if (prevAssigned.has(p.id)) cost += totalWeeks * 2;
          return cost === minCost;
        });

        // Pick randomly among those
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];

        // Remove from pool & record
        pool.splice(pool.indexOf(chosen), 1);
        out.push({ personId: p.id, weekId: w.id, role: chosen });

        // Bump counters
        personTotals[p.id] += 1;
        const base = chosen.replace(/\s*\d+$/, '');
        baseTotals[`${p.id}|${base}`] += 1;
      });
    });

    setAssignments(out);
  };



  // ─── CSV Headers & Rows ────────────────────────────────────
  const csvHeaders = [
    { label:'S/N',  key:'sn'   },
    { label:'Name', key:'name' },
    ...weeks.map(w => ({ label: w.label, key: w.id }))
  ];
  const csvRows = people.map((p, idx) => {
    const row = { sn: idx+1, name: p.name };
    weeks.forEach(w => {
      const a = assignments.find(a =>
        a.personId===p.id && a.weekId===w.id
      );
      row[w.id] = a ? a.role : '';
    });
    return row;
  });

  return (
    <div style={{
      padding:16,
      maxWidth:'98vw',
      margin:'0 auto',
      textAlign:'center',
      fontFamily:'sans-serif',
      fontSize:'0.9em'
    }}>
      <h1>CSS Ministry Roster</h1>

      {/* Bible verse */}
      <p style={{ margin:4 }}>
        <em>1 Peter 5:2: "I appeal to you to be shepherds of the flock that God gave you and to take care of it willingly, as God wants you to, and not unwillingly.</em>
      </p>
      <p style={{ margin:'0 0 16px' }}>
        <em>Do your work, not for mere pay, but from a real desire to serve."</em>
      </p>

      {/* Instructions */}
      <ol style={{ textAlign:'left', display:'inline-block', marginBottom:16 }}>
        <li>Add your people.</li>
        <li>Uncheck any week-header to skip that week.</li>
        <li>Check any cell-box to exclude that person.</li>
        <li>Click <strong>Auto-Assign Random Roles</strong>.</li>
        <li>Click <strong>Export CSV 🙂</strong></li>
      </ol>

      {/* Ministry dropdown */}
      <div style={{ margin:'8px 0' }}>
        <label>
          I am in&nbsp;
          <select
            value={ministry}
            onChange={e => setMinistry(e.target.value)}
          >
            {MINISTRY_OPTIONS.map(o => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Add person */}
      <PersonForm people={people} setPeople={setPeople} />

      {/* Roster table */}
      <RosterTable
        people={people}
        weeks={weeks}
        assignments={assignments}
        unavailable={unavailable}
        toggleUnavailable={toggleUnavailable}
        toggleVoided={toggleVoided}
        removePerson={removePerson}
      />

      {/* Auto-assign button */}
      <div style={{ margin:'1em 0' }}>
        <button onClick={autoAssign} style={{ padding:'8px 16px' }}>
          Auto-Assign Random Roles
        </button>
      </div>

      {/* Export CSV */}
      <div style={{ margin:'1em 0' }}>
        <CSVLink
          data={csvRows}
          headers={csvHeaders}
          filename="ministry-roster.csv"
          style={{ display:'inline-block', marginTop:8 }}
        >
          Export CSV 🙂
        </CSVLink>
      </div>
    </div>
  );
}

export default App;
