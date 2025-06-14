import React, { useState, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import { ROLES } from './types';
import PersonForm from './components/PersonForm';
import RosterTable from './components/RosterTable';

const DEFAULT_WEEKS = [
  { id:'wk1',  label:'wk 1',  voided:false },
  { id:'wk2',  label:'wk 2',  voided:false },
  { id:'wk3',  label:'wk 3',  voided:false },
  { id:'wk4',  label:'wk 4',  voided:false },
  { id:'wk5',  label:'wk 5',  voided:false },
  { id:'wk6',  label:'wk 6',  voided:false },
  { id:'mtr',  label:'Recess (MTR)', voided:false },
  { id:'wk7',  label:'wk 7',  voided:false },
  { id:'wk8',  label:'wk 8',  voided:false },
  { id:'wk9',  label:'wk 9',  voided:false },
  { id:'wk10', label:'wk 10', voided:false },
  { id:'wk11', label:'wk 11', voided:false },
  { id:'wk12', label:'wk 12', voided:false },
  { id:'wk13', label:'wk 13', voided:false },
];

function App() {
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

  useEffect(() => {
    localStorage.setItem(
      'roster',
      JSON.stringify({ people, assignments, unavailable })
    );
  }, [people, assignments, unavailable]);

  const toggleUnavailable = (pid, wid) => {
    const exists = unavailable.find(u => u.personId===pid && u.weekId===wid);
    if (exists) {
      setUnavailable(unavailable.filter(u => u!==exists));
    } else {
      setUnavailable([...unavailable, { personId: pid, weekId: wid }]);
    }
  };

  const toggleVoided = wid => {
    setWeeks(weeks.map(w =>
      w.id === wid ? { ...w, voided: !w.voided } : w
    ));
  };

  const removePerson = pid => {
    setPeople(people.filter(p => p.id !== pid));
    setAssignments(assignments.filter(a => a.personId !== pid));
    setUnavailable(unavailable.filter(u => u.personId !== pid));
  };

  const autoAssign = () => {
    const assignmentsOut = [];

    // 1) Track how many slots each person has gotten total
    const personTotals = {};
    // 2) Track how many times each person has done each *base* role
    const baseTotals = {};

    people.forEach(p => {
      personTotals[p.id] = 0;
      ROLES.forEach(r => {
        // strip off trailing digits, e.g. "AV 1" -> "AV"
        const base = r.replace(/\s*\d+$/, '');
        baseTotals[`${p.id}|${base}`] = 0;
      });
    });

    weeks.forEach((w, wIdx) => {
      if (w.voided) return;

      // who’s available this week?
      const avail = people.filter(p =>
        !unavailable.some(u => u.personId === p.id && u.weekId === w.id)
      );
      if (!avail.length) return;

      // 3) Greedy balance: pick the least-busy people first
      avail.sort((a, b) => personTotals[a.id] - personTotals[b.id]);

      // 4) Rotate the role order each week to vary which suffix (1 vs 2) shows up
      const rot = wIdx % ROLES.length;
      const rolesRotated = [
        ...ROLES.slice(rot),
        ...ROLES.slice(0, rot)
      ];

      // 5) For each person, choose the role in rolesRotated that
      //    minimizes (personTotals + baseTotals for that person & baseRole)
      avail.forEach(p => {
        if (!rolesRotated.length) return;

        let bestIdx = 0, bestCost = Infinity;
        rolesRotated.forEach((role, i) => {
          const base = role.replace(/\s*\d+$/, '');
          const cost = personTotals[p.id] + baseTotals[`${p.id}|${base}`];
          if (cost < bestCost) {
            bestCost = cost;
            bestIdx = i;
          }
        });

        const [chosenRole] = rolesRotated.splice(bestIdx, 1);
        assignmentsOut.push({
          personId: p.id,
          weekId:   w.id,
          role:     chosenRole
        });

        // bump both totals
        personTotals[p.id] += 1;
        const chosenBase = chosenRole.replace(/\s*\d+$/, '');
        baseTotals[`${p.id}|${chosenBase}`] += 1;
      });
    });

    setAssignments(assignmentsOut);
  };




  // CSV Building
  const csvHeaders = [
    { label:'S/N',  key:'sn'   },
    { label:'Name', key:'name' },
    ...weeks.map(w => ({ label: w.label, key: w.id }))
  ];
  const csvRows = people.map((p, idx) => {
    const row = { sn: idx+1, name: p.name };
    weeks.forEach(w => {
      const a = assignments.find(a => a.personId===p.id && a.weekId===w.id);
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
      <p style={{ margin:4 }}>
        <em>1 Peter 5:2 "I appeal to you to be shepherds of the flock that God gave you and to take care of it willingly, as God wants you to, and not unwillingly.</em>
      </p>
      <p style={{ margin:'0 0 16px' }}>
        <em>Do your work, not for mere pay, but from a real desire to serve."</em>
      </p>

      <ol style={{ textAlign:'left', display:'inline-block', marginBottom:16 }}>
        <li>Add your people.</li>
        <li>Uncheck any week-header to skip that week.</li>
        <li>Check any cell-box to exclude that person.</li>
        <li>Click <strong>Auto-Assign Random Roles</strong>.</li>
        <li>Click <strong>Export CSV 🙂</strong></li>
      </ol>

      <PersonForm people={people} setPeople={setPeople} />

      <RosterTable
        people={people}
        weeks={weeks}
        assignments={assignments}
        unavailable={unavailable}
        toggleUnavailable={toggleUnavailable}
        toggleVoided={toggleVoided}
        removePerson={removePerson}
      />

      <div style={{ margin:'1em 0' }}>
        <button onClick={autoAssign} style={{ padding:'8px 16px' }}>
          Auto-Assign Random Roles
        </button>
      </div>

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
