// src/components/RosterTable.js
import React from 'react';
import './RosterTable.css'; // see CSS below

export default function RosterTable({
  people,
  weeks,
  assignments,
  unavailable,
  toggleUnavailable,
  toggleVoided,
  removePerson
}) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table
        style={{
          width:'100%',
          borderCollapse:'collapse',
          margin:'0 auto',
          fontSize:'0.85em'
        }}
        border="1"
        cellPadding="6"
      >
        <thead>
          <tr>
            <th style={{ minWidth:120 }}>Person＼Week→</th>
            {weeks.map(w => (
              <th
                key={w.id}
                style={{
                  background: w.voided ? '#eee' : 'white',
                  position:'relative'
                }}
              >
                {w.label}
                <input
                  type="checkbox"
                  checked={!w.voided}
                  onChange={() => toggleVoided(w.id)}
                  title="Include this week"
                  style={{
                    position:'absolute',
                    top:4,
                    right:4,
                    transform:'scale(0.8)',
                    cursor:'pointer'
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {people.map(p => (
            <tr key={p.id}>
              <td className="person-cell">
                {p.name}
                <button
                  className="delete-btn"
                  onClick={() => removePerson(p.id)}
                  title="Remove person"
                >
                  ×
                </button>
              </td>

              {weeks.map(w => {
                const isExcluded = unavailable.some(
                  u => u.personId===p.id && u.weekId===w.id
                );
                const role = assignments.find(
                  a => a.personId===p.id && a.weekId===w.id
                )?.role;

                return (
                  <td
                    key={w.id}
                    style={{
                      minWidth:100,
                      verticalAlign:'top',
                      background: w.voided
                        ? '#f9f9f9'
                        : isExcluded
                          ? '#fdd'
                          : 'white',
                      position:'relative'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isExcluded}
                      onChange={() => toggleUnavailable(p.id, w.id)}
                      title="Exclude this person"
                      style={{
                        position:'absolute',
                        top:4,
                        right:4,
                        transform:'scale(0.8)',
                        cursor:'pointer'
                      }}
                    />

                    <div style={{ paddingTop:18, minHeight:18 }}>
                      {w.voided
                        ? <em style={{ color:'#888' }}>n/a</em>
                        : isExcluded
                          ? <em style={{ color:'#a00' }}>Excluded</em>
                          : role
                            ? <>• {role}</>
                            : <em style={{ color:'#888' }}>—</em>
                      }
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
