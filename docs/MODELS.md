# Ideas for Models

Swoopy is designed for "conversation while building," these demonstration models reveal non-intuitive behaviors - specifically where human common sense usually fails.

## 1. The "Brooks' Law" Model (Managing Scale)

Demonstrates Edge Weights and Balancing Loops with high impact.
It visualizes the famous adage: "Adding manpower to a late software project makes it later."

```plaintext
Nodes:
  New Hires (The lever)
  Team Size (Stock)
  Communication Overhead (Variable)
  Effective Progress (Stock)
Edges:
  New Hires → Team Size (+ polarity)
  Team Size → Communication Overhead (+ polarity, Weight: 3.0). # This shows that communication complexity grows faster than linear growth.
  Communication Overhead → Effective Progress (− polarity, Weight: 2.0)
  Team Size → Effective Progress (+ polarity, Weight: 1.0)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiTmV3IEhpcmVzIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJUZWFtIFNpemUiLCJ4Ijo0MDAsInkiOjU1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IkNvbW11bmljYXRpb24gT3ZlcmhlYWQiLCJ4IjoxNTAsInkiOjMwMC4wMDAwMDAwMDAwMDAwNiwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjQiLCJsYWJlbCI6IkVmZmVjdGl2ZSBQcm9ncmVzcyIsIngiOjM5OS45OTk5OTk5OTk5OTk5NCwieSI6NTAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX1dLCJlZGdlcyI6W3sia2luZCI6ImNhdXNhbCIsImlkIjoiZTEiLCJmcm9tIjoibjEiLCJ0byI6Im4yIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTIiLCJmcm9tIjoibjIiLCJ0byI6Im4zIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MywiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTMiLCJmcm9tIjoibjMiLCJ0byI6Im40IiwicG9sYXJpdHkiOjEsIndlaWdodCI6MiwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTQiLCJmcm9tIjoibjIiLCJ0byI6Im40IiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9XX19)

Learning: Users see that as they inject signals into New Hires, progress might actually drop or plateau because the "Communication Overhead" edge (with its higher weight) cancels out the benefit of the larger team.

## 2. The "Glass Ceiling" (Resource Constraint)

This is the perfect showcase for Constraint Edges (Ceiling), a feature that distinguishes Swoopy from the original Loopy.

```plaintext
Nodes:
  Marketing Effort (Lever)
  Active Users (Stock)
  Server Capacity (The Constraint Source)
Edges:
  Marketing Effort → Active Users (+ polarity)
  Active Users → Active Users (+ polarity, reinforcing loop)
  Server Capacity ⊣ Active Users (Ceiling Constraint)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiTWFya2V0aW5nIEVmZm9ydCIsIngiOjY1MCwieSI6MzAwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMiIsImxhYmVsIjoiQWN0aXZlIFVzZXJzIiwieCI6Mjc1LjAwMDAwMDAwMDAwMDA2LCJ5Ijo1MTYuNTA2MzUwOTQ2MTA5NywicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IlNlcnZlciBDYXBhY2l0eSIsIngiOjI3NC45OTk5OTk5OTk5OTk5LCJ5Ijo4My40OTM2NDkwNTM4OTAzOCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fV0sImVkZ2VzIjpbeyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMSIsImZyb20iOiJuMSIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMiIsImZyb20iOiJuMiIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY29uc3RyYWludCIsImlkIjoiZTMiLCJmcm9tIjoibjMiLCJ0byI6Im4yIiwiY29uc3RyYWludEtpbmQiOiJjZWlsaW5nIn1dfX0=)

See the [Glass Ceiling](http://localhost:5173/?m=c47c1f89-7a80-4f42-8ded-e934a95541a0&g=eyJ2ZXJzaW9uIjo0LCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiTWFya2V0aW5nIEVmZm9ydCIsIngiOjkwLjgxMjUsInkiOjIwMy41MzkwNjI1LCJyYWRpdXMiOjQwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjAsInNpemVUaWVyIjoibSIsImNvbG91clRpZXIiOiJ5ZWxsb3cifSx7ImlkIjoibjIiLCJsYWJlbCI6IkFjdGl2ZSBVc2VycyIsIngiOjM5NS41MTE3MTg3NSwieSI6MTk4LjI0MjE4NzUsInJhZGl1cyI6NDAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6MCwic2l6ZVRpZXIiOiJtIiwiY29sb3VyVGllciI6ImdyZWVuIn0seyJpZCI6Im4zIiwibGFiZWwiOiJTZXJ2ZXIgQ2FwYWNpdHkiLCJ4IjozOTYuMjA3MDMxMjUsInkiOjQyMi4wNzQyMTg3NSwicmFkaXVzIjo0MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjoyLCJzaXplVGllciI6Im0iLCJjb2xvdXJUaWVyIjoicmVkIiwiYW5ub3RhdGlvbiI6IkxpbWl0cyBBY3RpdmUgVXNlcnMgZ3Jvd3RoIn1dLCJlZGdlcyI6W3sia2luZCI6ImNhdXNhbCIsImlkIjoiZTEiLCJmcm9tIjoibjEiLCJ0byI6Im4yIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTIiLCJmcm9tIjoibjIiLCJ0byI6Im4yIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNvbnN0cmFpbnQiLCJjb25zdHJhaW50S2luZCI6ImNlaWxpbmciLCJpZCI6ImUzIiwiZnJvbSI6Im4zIiwidG8iOiJuMiJ9XSwiYW5ub3RhdGlvbnMiOlt7ImlkIjoiOTZhMWFlYjgtODE3Mi00NTc1LWJmNmMtYzUwMWM4ZTUwYTA2IiwieCI6MTEzLjc5Mjk2ODc1LCJ5Ijo0NS42OTE0MDYyNSwidGV4dCI6IjEuIEluamVjdCBpbnRvIE1hcmtldGluZyBFZmZvcnQgdG8gc2VlIHRoZSBjYXAsIFxuMi4gdGhlbiBpbmplY3QgaW50byBTZXJ2ZXIgQ2FwYWNpdHkgdG8gc2VlIHRoZSBjYXAgbGlmdFxuMy4gdmlldyB0aGUgaGlzdG9yeSBncmFwaC10YWJsZSB0byBzZWUgdGhlIHJlc3VsdHMifV19fQ%3D%3D) effect.

Learning: Even if the user keeps pumping marketing signals, the Active Users node will physically stop growing once it hits the value of Server Capacity. If you then "inject" a signal into Server Capacity to increase it, you'll see the Active Users immediately resume their growth. The model now includes annotations guiding users through the demonstration and highlighting the constraint's role. The model now includes annotations guiding users through the demonstration and highlighting the constraint's role.

## 3. The "Agile Debt" Trap

This demonstrates Delays and Reinforcing Loops.

```plaintext
Nodes:
  Pressure to Deliver
  Quick Fixes
  Technical Debt
  Feature Velocity
Edges:
  Pressure → Quick Fixes (+ polarity)
  Quick Fixes → Technical Debt (+ polarity, Delay: Long/Months)
  Technical Debt → Feature Velocity (− polarity)
  Feature Velocity → Pressure (− polarity, i.e., high velocity reduces pressure)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiUHJlc3N1cmUgdG8gRGVsaXZlciIsIngiOjY1MCwieSI6MzAwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMiIsImxhYmVsIjoiUXVpY2sgRml4ZXMiLCJ4Ijo0MDAsInkiOjU1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IlRlY2huaWNhbCBEZWJ0IiwieCI6MTUwLCJ5IjozMDAuMDAwMDAwMDAwMDAwMDYsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im40IiwibGFiZWwiOiJGZWF0dXJlIFZlbG9jaXR5IiwieCI6Mzk5Ljk5OTk5OTk5OTk5OTk0LCJ5Ijo1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fV0sImVkZ2VzIjpbeyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMiIsImZyb20iOiJuMiIsInRvIjoibjMiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6ImxvbmciLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMyIsImZyb20iOiJuMyIsInRvIjoibjQiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn1dfX0=)

Learning:
Because of the Long Delay on the Debt edge, the system feels great initially. Quick Fixes keep Velocity high and Pressure low. Then, minutes later, the "Debt" signals finally arrive, crashing Velocity and creating an inescapable Pressure loop.

## 4. The "Success to the Successful" (Market Competition)

This demonstrates how relative edge weights and lack of intrinsic decay create "winner-takes-all" dynamics.

```plaintext
Nodes:
  Product A Quality
  Product B Quality
  Product A Market Share
  Product B Market Share
Edges:
  A Quality → A Market Share (+)
  B Quality → B Market Share (+)
  A Market Share → B Market Share (− polarity, competition)
  B Market Share → A Market Share (− polarity, competition)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiUHJvZHVjdCBBIFF1YWxpdHkiLCJ4Ijo2NTAsInkiOjMwMCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjIiLCJsYWJlbCI6IlByb2R1Y3QgQiBRdWFsaXR5IiwieCI6NDAwLCJ5Ijo1NTAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4zIiwibGFiZWwiOiJQcm9kdWN0IEEgTWFya2V0IFNoYXJlIiwieCI6MTUwLCJ5IjozMDAuMDAwMDAwMDAwMDAwMDYsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im40IiwibGFiZWwiOiJQcm9kdWN0IEIgTWFya2V0IFNoYXJlIiwieCI6Mzk5Ljk5OTk5OTk5OTk5OTk0LCJ5Ijo1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fV0sImVkZ2VzIjpbXX19)

Learning: Because there is no intrinsic decay (DR-001), once one product gains a slight edge (even by a single click), it will suppress the other indefinitely. This showcases the "path dependency" of the simulation.

## 5. "Shifting the Burden" (The Consultant's Trap)

Demonstrates the tension between a Quick Fix and a Fundamental Solution, utilizing Delays.

```plaintext
Nodes:
  Problem Symptom
  Quick Fix
  Fundamental Solution
  Side Effect
Edges:
  Problem Symptom → Quick Fix (+ polarity)
  Quick Fix → Problem Symptom (− polarity)
  Problem Symptom → Fundamental Solution (+ polarity)
  Fundamental Solution → Problem Symptom (− polarity, Delay: Long)
  Quick Fix → Side Effect (+ polarity)
  Side Effect → Fundamental Solution (− polarity)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiUHJvYmxlbSBTeW1wdG9tIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJRdWljayBGaXgiLCJ4Ijo0MDAsInkiOjU1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IkZ1bmRhbWVudGFsIFNvbHV0aW9uIiwieCI6MTUwLCJ5IjozMDAuMDAwMDAwMDAwMDAwMDYsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im40IiwibGFiZWwiOiJTaWRlIEVmZmVjdCIsIngiOjM5OS45OTk5OTk5OTk5OTk5NCwieSI6NTAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX1dLCJlZGdlcyI6W3sia2luZCI6ImNhdXNhbCIsImlkIjoiZTEiLCJmcm9tIjoibjEiLCJ0byI6Im4yIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTIiLCJmcm9tIjoibjIiLCJ0byI6Im4xIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTMiLCJmcm9tIjoibjEiLCJ0byI6Im4zIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTQiLCJmcm9tIjoibjMiLCJ0byI6Im4xIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJsb25nIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTUiLCJmcm9tIjoibjIiLCJ0byI6Im40IiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTYiLCJmcm9tIjoibjQiLCJ0byI6Im4zIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9XX19)

Learning: The Quick Fix works immediately, but its Side Effect undermines the Fundamental Solution. Because the Fundamental solution has a long delay, the system stays hooked on the Quick Fix.

## 6. "Ecosystem Dynamics" (Complex-Adaptive System)

Demonstrates predator-prey oscillations, carrying capacity, and environmental adaptation in a multi-species ecosystem.

```plaintext
Nodes:
  Rabbits (Prey population)
  Foxes (Predator population)
  Grass (Resource base)
  Carrying Capacity (Environmental limit)
  Environmental Stress (External perturbation)
Edges:
  Grass → Rabbits (+, high weight - food availability drives reproduction)
  Rabbits → Foxes (+, predation increases predator population)
  Foxes → Rabbits (−, predation decreases prey population)
  Rabbits → Grass (−, grazing depletes resource)
  Grass → Grass (+, regeneration when not overgrazed)
  Carrying Capacity ⊣ Rabbits (ceiling constraint)
  Carrying Capacity ⊣ Foxes (ceiling constraint)
  Environmental Stress → Carrying Capacity (−, reduces habitat)
  Environmental Stress → Grass (−, reduces regeneration)
```

[Open in Swoopy](http://localhost:5173/?m=c8f57c13-93ca-4859-b903-b78d98872c55&g=eyJ2ZXJzaW9uIjo0LCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiUmFiYml0cyIsIngiOjYxNi42MjEwOTM3NSwieSI6NTU4LjAzMTI1LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAwLCJpbml0aWFsIjozMCwic2l6ZVRpZXIiOiJtIiwiY29sb3VyVGllciI6InllbGxvdyJ9LHsiaWQiOiJuMiIsImxhYmVsIjoiRm94ZXMiLCJ4Ijo2MjIsInkiOjI3NS4wNTA3ODEyNSwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwMCwiaW5pdGlhbCI6MTAsInNpemVUaWVyIjoibSIsImNvbG91clRpZXIiOiJvcmFuZ2UifSx7ImlkIjoibjMiLCJsYWJlbCI6IkdyYXNzIiwieCI6MjU4LjI3MzQzNzUsInkiOjU2Mi41MjczNDM3NSwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwMCwiaW5pdGlhbCI6ODAsInNpemVUaWVyIjoibSIsImNvbG91clRpZXIiOiJncmVlbiJ9LHsiaWQiOiJuNCIsImxhYmVsIjoiQ2FycnlpbmcgQ2FwYWNpdHkiLCJ4Ijo0MDAsInkiOjEwMCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwMCwiaW5pdGlhbCI6ODAsInNpemVUaWVyIjoibSIsImNvbG91clRpZXIiOiJibHVlIn0seyJpZCI6Im41IiwibGFiZWwiOiJFbnZpcm9ubWVudGFsIFN0cmVzcyIsIngiOjE2NS41ODU5Mzc1LCJ5IjoyNzguMjE0ODQzNzUsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMDAsImluaXRpYWwiOjAsInNpemVUaWVyIjoibSIsImNvbG91clRpZXIiOiJyZWQiLCJhbm5vdGF0aW9uIjoiSW50cm9kdWNlIHN0cmVzcyBoZXJlIn1dLCJlZGdlcyI6W3sia2luZCI6ImNhdXNhbCIsImlkIjoiZTEiLCJmcm9tIjoibjMiLCJ0byI6Im4xIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MywiZGVsYXkiOiJzaG9ydCIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUyIiwiZnJvbSI6Im4xIiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUzIiwiZnJvbSI6Im4yIiwidG8iOiJuMSIsInBvbGFyaXR5IjotMSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNCIsImZyb20iOiJuMSIsInRvIjoibjMiLCJwb2xhcml0eSI6LTEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTUiLCJmcm9tIjoibjMiLCJ0byI6Im4zIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNvbnN0cmFpbnQiLCJjb25zdHJhaW50S2luZCI6ImNlaWxpbmciLCJpZCI6ImU2IiwiZnJvbSI6Im40IiwidG8iOiJuMSJ9LHsia2luZCI6ImNvbnN0cmFpbnQiLCJjb25zdHJhaW50S2luZCI6ImNlaWxpbmciLCJpZCI6ImU3IiwiZnJvbSI6Im40IiwidG8iOiJuMiJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTgiLCJmcm9tIjoibjUiLCJ0byI6Im40IiwicG9sYXJpdHkiOi0xLCJ3ZWlnaHQiOjEuNSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTkiLCJmcm9tIjoibjUiLCJ0byI6Im4zIiwicG9sYXJpdHkiOi0xLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifV19fQ%3D%3D)

Learning: This improved model demonstrates how **delays create stability** in complex systems. The short delay on the Grass→Rabbits edge (biomass conversion lag) prevents predator overshoot from instantly causing prey extinction, allowing oscillations to dampen rather than collapse. Watch the population cycles: initial recovery (ticks 420-840), brief instability with fox predation spike (ticks 840-1080), and finally **convergence to equilibrium** (ticks 1200+) where all populations reach carrying capacity around 74-87.

**Simulation Analysis**: Ticks 0-360 show initialization under environmental stress (stress=2). Recovery begins at tick 420 when rabbits = 2, then follows classic damped oscillations: rabbits peak at 52, foxes peak at 74+, then predation causes rabbit crash to 0. Mysteriously, rabbits recover to 46 by tick 1200, suggesting grass abundance allows rebound. The **short delay on food conversion** is critical—it acts as a natural regulator preventing predator-prey collapse. By tick 1300+, the system stabilizes at all populations = 74, bounded by carrying capacity. This shows how biological delays (gestation, growth) enable resilience in real ecosystems.

Showcases how a single Constraint Source can suppress multiple independent nodes.

```plaintext
Nodes:
  Team A Velocity
  Team B Velocity
  Shared Capacity (The Constraint Source, initial: 10)
Edges:
  Team A Velocity → Shared Capacity (− polarity)
  Team B Velocity → Shared Capacity (− polarity)
  Shared Capacity ⊣ Team A Velocity (Ceiling)
  Shared Capacity ⊣ Team B Velocity (Ceiling)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiVGVhbSBBIFZlbG9jaXR5IiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJUZWFtIEIgVmVsb2NpdHkiLCJ4IjoyNzUuMDAwMDAwMDAwMDAwMDYsInkiOjUxNi41MDYzNTA5NDYxMDk3LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMyIsImxhYmVsIjoiU2hhcmVkIENhcGFjaXR5IiwieCI6Mjc0Ljk5OTk5OTk5OTk5OTksInkiOjgzLjQ5MzY0OTA1Mzg5MDM4LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxIiwiZnJvbSI6Im4xIiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUyIiwiZnJvbSI6Im4yIiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjb25zdHJhaW50IiwiaWQiOiJlMyIsImZyb20iOiJuMyIsInRvIjoibjEiLCJjb25zdHJhaW50S2luZCI6ImNlaWxpbmcifSx7ImtpbmQiOiJjb25zdHJhaW50IiwiaWQiOiJlNCIsImZyb20iOiJuMyIsInRvIjoibjIiLCJjb25zdHJhaW50S2luZCI6ImNlaWxpbmcifV19fQ==)

Learning: As Team A grows, they consume capacity, which automatically lowers the ceiling for Team B.

## 7. "Escalation" (The Arms Race)

Demonstrates how two balancing loops create a "race to the bottom" using high Edge Weights.

```plaintext
Nodes:
  Our Price
  Competitor Price
  Market Share Gap
Edges:
  Our Price → Market Share Gap (− polarity, Weight: 3.0)
  Competitor Price → Market Share Gap (+ polarity, Weight: 3.0)
  Market Share Gap → Our Price (+ polarity)
  Market Share Gap → Competitor Price (− polarity)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiT3VyIFByaWNlIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJDb21wZXRpdG9yIFByaWNlIiwieCI6Mjc1LjAwMDAwMDAwMDAwMDA2LCJ5Ijo1MTYuNTA2MzUwOTQ2MTA5NywicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6Ik1hcmtldCBTaGFyZSBHYXAiLCJ4IjoyNzQuOTk5OTk5OTk5OTk5OSwieSI6ODMuNDkzNjQ5MDUzODkwMzgsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX1dLCJlZGdlcyI6W3sia2luZCI6ImNhdXNhbCIsImlkIjoiZTEiLCJmcm9tIjoibjEiLCJ0byI6Im4zIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MywiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTIiLCJmcm9tIjoibjIiLCJ0byI6Im4zIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MywiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTMiLCJmcm9tIjoibjMiLCJ0byI6Im4xIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTQiLCJmcm9tIjoibjMiLCJ0byI6Im4yIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9XX19)

Learning: Any small price cut by one side is amplified by the high weight, forcing a massive reaction from the other side.

## 8. "Accidental Adversaries" (Inter-team Friction)

Demonstrates how two parties, initially working together, can inadvertently undermine each other through local optimizations.

```plaintext
Nodes:
  Team A Activity
  Team B Activity
  Team A Success
  Team B Success
Edges:
  Team A Activity → Team A Success (+ polarity)
  Team B Activity → Team B Success (+ polarity)
  Team A Success → Team B Activity (− polarity, Weight: 2.0, Delay: Medium)
  Team B Success → Team A Activity (− polarity, Weight: 2.0, Delay: Medium)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiVGVhbSBBIEFjdGl2aXR5IiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJUZWFtIEIgQWN0aXZpdHkiLCJ4Ijo0MDAsInkiOjU1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IlRlYW0gQSBTdWNjZXNzIiwieCI6MTUwLCJ5IjozMDAuMDAwMDAwMDAwMDAwMDYsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im40IiwibGFiZWwiOiJUZWFtIEIgU3VjY2VzcyIsIngiOjM5OS45OTk5OTk5OTk5OTk5NCwieSI6NTAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX1dLCJlZGdlcyI6W3sia2luZCI6ImNhdXNhbCIsImlkIjoiZTEiLCJmcm9tIjoibjEiLCJ0byI6Im4zIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTIiLCJmcm9tIjoibjIiLCJ0byI6Im40IiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTMiLCJmcm9tIjoibjMiLCJ0byI6Im4yIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MiwiZGVsYXkiOiJtZWRpdW0iLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNCIsImZyb20iOiJuNCIsInRvIjoibjEiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoyLCJkZWxheSI6Im1lZGl1bSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifV19fQ==)

Learning: As Team A succeeds, their processes or resource consumption inadvertently make life harder for Team B (and vice versa). Because of the **Delay**, the teams don't realize they are the cause of each other's problems until the friction is already high.

## 9. "Eroding Goals" (The "Good Enough" Trap)

Showcases how systems often "solve" a gap between a goal and reality by lowering the goal instead of improving the condition.

```plaintext
Nodes:
  Quality Goal
  Actual Quality
  Quality Gap
  Pressure to Lower Goal
Edges:
  Quality Goal → Quality Gap (+ polarity)
  Actual Quality → Quality Gap (− polarity)
  Quality Gap → Actual Quality (+ polarity, Delay: Long) # Improving takes time
  Quality Gap → Pressure to Lower Goal (+ polarity)
  Pressure to Lower Goal → Quality Goal (− polarity, Weight: 2.0)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiUXVhbGl0eSBHb2FsIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJBY3R1YWwgUXVhbGl0eSIsIngiOjQwMCwieSI6NTUwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMyIsImxhYmVsIjoiUXVhbGl0eSBHYXAiLCJ4IjoxNTAsInkiOjMwMC4wMDAwMDAwMDAwMDAwNiwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjQiLCJsYWJlbCI6IlByZXNzdXJlIHRvIExvd2VyIEdvYWwiLCJ4IjozOTkuOTk5OTk5OTk5OTk5OTQsInkiOjUwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxIiwiZnJvbSI6Im4xIiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUyIiwiZnJvbSI6Im4yIiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUzIiwiZnJvbSI6Im4zIiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5IjoibG9uZyIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU0IiwiZnJvbSI6Im4zIiwidG8iOiJuNCIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU1IiwiZnJvbSI6Im40IiwidG8iOiJuMSIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjIsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifV19fQ==)

Learning: Because improving `Actual Quality` has a **Long Delay**, the `Pressure to Lower Goal` (which acts instantly) usually wins. The system "stabilizes" by degrading its own standards.

## 10. "The Bullwhip Effect" (Supply Chain Volatility)

Demonstrates the phenomenon central to the famous **"Beer Game"** simulation: how small fluctuations in demand amplify as they move through a chain of actors with delays.

```plaintext
Nodes:
  Customer Demand (The Lever)
  Retailer Orders
  Wholesaler Orders
  Factory Production
Edges:
  Customer Demand → Retailer Orders (+ polarity, Delay: Short)
  Retailer Orders → Wholesaler Orders (+ polarity, Weight: 1.5, Delay: Medium)
  Wholesaler Orders → Factory Production (+ polarity, Weight: 2.0, Delay: Long)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiQ3VzdG9tZXIgRGVtYW5kIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJSZXRhaWxlciBPcmRlcnMiLCJ4Ijo0MDAsInkiOjU1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6Ildob2xlc2FsZXIgT3JkZXJzIiwieCI6MTUwLCJ5IjozMDAuMDAwMDAwMDAwMDAwMDYsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im40IiwibGFiZWwiOiJGYWN0b3J5IFByb2R1Y3Rpb24iLCJ4IjozOTkuOTk5OTk5OTk5OTk5OTQsInkiOjUwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxIiwiZnJvbSI6Im4xIiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoic2hvcnQiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMiIsImZyb20iOiJuMiIsInRvIjoibjMiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLjUsImRlbGF5IjoibWVkaXVtIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTMiLCJmcm9tIjoibjMiLCJ0byI6Im40IiwicG9sYXJpdHkiOjEsIndlaWdodCI6MiwiZGVsYXkiOiJsb25nIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9XX19)

Learning: A single click (injection) on `Customer Demand` results in a massive, delayed surge at the `Factory Production` node. The increasing **Weights** and **Delays** show why supply chains often over-correct and then crash.

## 11. "Push vs. Pull" (Kanban WIP Limits)

Demonstrates how WIP limits transform a system from "Push" (unlimited accumulation) to "Pull" (capacity-constrained flow).

```plaintext
Nodes:
  Incoming Demand (The Lever)
  Work In Progress (WIP)
  Delivery Rate (The Output)
  WIP Limit (The Constraint Source, initial: 3)
Edges:
  Incoming Demand → Work In Progress (+ polarity)
  Work In Progress → Delivery Rate (+ polarity)
  Work In Progress → Incoming Demand (− polarity, Delay: Medium) # The "Feedback" of a full system
  WIP Limit ⊣ Work In Progress (Ceiling Constraint)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiSW5jb21pbmcgRGVtYW5kIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJXb3JrIEluIFByb2dyZXNzIiwieCI6NDAwLCJ5Ijo1NTAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4zIiwibGFiZWwiOiJEZWxpdmVyeSBSYXRlIiwieCI6MTUwLCJ5IjozMDAuMDAwMDAwMDAwMDAwMDYsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im40IiwibGFiZWwiOiJXSVAgTGltaXQiLCJ4IjozOTkuOTk5OTk5OTk5OTk5OTQsInkiOjUwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxIiwiZnJvbSI6Im4xIiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUyIiwiZnJvbSI6Im4yIiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUzIiwiZnJvbSI6Im4yIiwidG8iOiJuMSIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5IjoibWVkaXVtIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNvbnN0cmFpbnQiLCJpZCI6ImU0IiwiZnJvbSI6Im40IiwidG8iOiJuMiIsImNvbnN0cmFpbnRLaW5kIjoiY2VpbGluZyJ9XX19)

**Scenario A (Push):** Set `WIP Limit` to 10 (or remove the constraint). Repeatedly inject into `Incoming Demand`. `Work In Progress` will skyrocket, but if you add a negative edge from `WIP` to `Delivery Rate` (Weight: 2.0) to represent **Context Switching**, you'll see throughput actually drop as WIP rises.

**Scenario B (Pull):** Set `WIP Limit` to 3. No matter how many times you click `Incoming Demand`, the `Work In Progress` node is physically capped at 3. The system stays "lean," and the negative feedback to Demand ensures the backlog doesn't grow out of control.

Learning: Users see that the WIP Limit isn't just a "rule"—it's a physical stabilizer that prevents the system from reaching the "Context Switching" tipping point.

## 12. "The Hand-off Silo" (Wait Time & Rework)

Demonstrates how hand-offs between siloed teams create "hidden" queues and feedback loops that slow down the entire system.

```plaintext
Nodes:
  Design Queue
  Dev Queue
  QA Queue (The Hand-off Buffer)
  Completed Features
Edges:
  Design Queue → Dev Queue (+ polarity, Delay: Short)
  Dev Queue → QA Queue (+ polarity, Delay: Medium)
  QA Queue → Completed Features (+ polarity, Delay: Short)
  QA Queue → Dev Queue (+ polarity, Weight: 2.0) # Rework loop: bugs found in QA
  QA Queue → Design Queue (− polarity, Weight: 1.5) # Pressure: Too much in QA slows new designs
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiRGVzaWduIFF1ZXVlIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJEZXYgUXVldWUiLCJ4Ijo0MDAsInkiOjU1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IlFBIFF1ZXVlIiwieCI6MTUwLCJ5IjozMDAuMDAwMDAwMDAwMDAwMDYsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im40IiwibGFiZWwiOiJDb21wbGV0ZWQgRmVhdHVyZXMiLCJ4IjozOTkuOTk5OTk5OTk5OTk5OTQsInkiOjUwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxIiwiZnJvbSI6Im4xIiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoic2hvcnQiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMiIsImZyb20iOiJuMiIsInRvIjoibjMiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im1lZGl1bSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUzIiwiZnJvbSI6Im4zIiwidG8iOiJuNCIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoic2hvcnQiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNCIsImZyb20iOiJuMyIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoyLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNSIsImZyb20iOiJuMyIsInRvIjoibjEiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLjUsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifV19fQ==)

Learning: Because of the **Medium Delay** between Dev and QA, developers often start new work before the QA results for the previous task come back. When the "Rework" signal eventually hits the `Dev Queue` with a high weight (2.0), it creates a massive spike in WIP, forcing the team into a firefighting mode.

## 13. "The Blocked Dependency" (Component Waiting)

Uses a **Ceiling Constraint** to show how a dependency on another team acts as a hard cap on delivery, regardless of how much effort is "pushed" into the system.

```plaintext
Nodes:
  Feature Development (Our Team)
  Shared Component API (Dependency Team)
  Integrated Release
Edges:
  Feature Development → Integrated Release (+ polarity)
  Shared Component API ⊣ Integrated Release (Ceiling Constraint)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiRmVhdHVyZSBEZXZlbG9wbWVudCIsIngiOjY1MCwieSI6MzAwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMiIsImxhYmVsIjoiU2hhcmVkIENvbXBvbmVudCBBUEkiLCJ4IjoyNzUuMDAwMDAwMDAwMDAwMDYsInkiOjUxNi41MDYzNTA5NDYxMDk3LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMyIsImxhYmVsIjoiSW50ZWdyYXRlZCBSZWxlYXNlIiwieCI6Mjc0Ljk5OTk5OTk5OTk5OTksInkiOjgzLjQ5MzY0OTA1Mzg5MDM4LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxIiwiZnJvbSI6Im4xIiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjb25zdHJhaW50IiwiaWQiOiJlMiIsImZyb20iOiJuMiIsInRvIjoibjMiLCJjb25zdHJhaW50S2luZCI6ImNlaWxpbmcifV19fQ==)

**The Scenario:**

1. Inject signals into `Feature Development`. Notice `Integrated Release` rises, but only up to the level of the `Shared Component API`.
2. Even if you "flood" Feature Development, the release stays capped.
3. Inject a signal into `Shared Component API` (representing the other team finishing a version). Watch the `Integrated Release` immediately jump to meet the new ceiling.

Learning: This visually separates "Busy-ness" (our team working) from "Throughput" (actual releases). It proves that optimizing the team _upstream_ of a dependency is a waste of effort if the dependency itself isn't unblocked.

## 14. "Inventory Waste" (The Perishable Goods Trap)

Demonstrates how delays in adjusting production to match demand lead to overproduction and eventually waste/obsolescence.

```plaintext
Nodes:
  Production Rate (Lever)
  Inventory (Stock)
  Customer Sales
  Waste / Spoilage
Edges:
  Production Rate → Inventory (+ polarity)
  Customer Sales → Inventory (− polarity)
  Inventory → Waste / Spoilage (+ polarity, Delay: Long)
  Inventory → Production Rate (− polarity, Delay: Medium) # The Feedback Loop
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiUHJvZHVjdGlvbiBSYXRlIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJJbnZlbnRvcnkiLCJ4Ijo0MDAsInkiOjU1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IkN1c3RvbWVyIFNhbGVzIiwieCI6MTUwLCJ5IjozMDAuMDAwMDAwMDAwMDAwMDYsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im40IiwibGFiZWwiOiJXYXN0ZSAvIFNwb2lsYWdlIiwieCI6Mzk5Ljk5OTk5OTk5OTk5OTk0LCJ5Ijo1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fV0sImVkZ2VzIjpbeyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMSIsImZyb20iOiJuMSIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMiIsImZyb20iOiJuMyIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMyIsImZyb20iOiJuMiIsInRvIjoibjQiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6ImxvbmciLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNCIsImZyb20iOiJuMiIsInRvIjoibjEiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im1lZGl1bSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifV19fQ==)

**The Scenario:**

1. Inject signals into `Customer Sales` to represent a steady market.
2. Inject into `Production Rate` to match it. `Inventory` stays stable.
3. Suddenly stop injecting into `Customer Sales` (market crash).
4. Because of the **Medium Delay** on the feedback loop, `Production Rate` continues for a while, causing `Inventory` to spike.
5. Eventually, the **Long Delay** on the `Waste` edge triggers, and signals start flooding into the `Waste` node.

Learning: Users see that waste is a "lagging indicator." By the time you see the `Waste` node rising, the damage (overproduction) was done minutes ago. It highlights the need for shorter feedback cycles (reducing the Medium Delay).

## 15. "The Scrum Death Spiral" (Carryover & Pressure)

Demonstrates how neglecting refinement to "save time" creates a reinforcing loop of carryover, incidents, and management pressure.

```plaintext
Nodes:
  Refinement Quality (The Lever)
  Planning Clarity
  Sprint Carryover
  Production Incidents
  Failure Demand (Bugs/Support)
  Stakeholder Trust
  Management Pressure
Edges:
  Refinement Quality → Planning Clarity (+ polarity)
  Planning Clarity → Sprint Carryover (− polarity)
  Sprint Carryover → Production Incidents (+ polarity, Delay: Medium) # Rushed "done" work
  Production Incidents → Failure Demand (+ polarity)
  Failure Demand → Refinement Quality (− polarity, Weight: 2.0) # Bugs eat refinement time
  Sprint Carryover → Stakeholder Trust (− polarity, Delay: Medium)
  Stakeholder Trust → Management Pressure (− polarity) # Loss of trust increases pressure
  Management Pressure → Refinement Quality (− polarity, Weight: 1.5) # "Stop talking, start coding"
  Management Pressure → Planning Clarity (− polarity) # Forced commitments blur plans
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiUmVmaW5lbWVudCBRdWFsaXR5IiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJQbGFubmluZyBDbGFyaXR5IiwieCI6NTU1Ljg3MjQ1MDQ2NDY4MzQsInkiOjQ5NS40NTc4NzA2MTcwMDc0LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMyIsImxhYmVsIjoiU3ByaW50IENhcnJ5b3ZlciIsIngiOjM0NC4zNjk3NjY1MTA5MjE0LCJ5Ijo1NDMuNzMxOTc4MDQ1NDU1OSwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjQiLCJsYWJlbCI6IlByb2R1Y3Rpb24gSW5jaWRlbnRzIiwieCI6MTc0Ljc1Nzc4MzAyNDM5NTI1LCJ5Ijo0MDguNDcwOTM0Nzc5Mzg5NTUsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im41IiwibGFiZWwiOiJGYWlsdXJlIERlbWFuZCIsIngiOjE3NC43NTc3ODMwMjQzOTUyMiwieSI6MTkxLjUyOTA2NTIyMDYxMDUsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im42IiwibGFiZWwiOiJTdGFrZWhvbGRlciBUcnVzdCIsIngiOjM0NC4zNjk3NjY1MTA5MjEzNSwieSI6NTYuMjY4MDIxOTU0NTQ0MDgsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im43IiwibGFiZWwiOiJNYW5hZ2VtZW50IFByZXNzdXJlIiwieCI6NTU1Ljg3MjQ1MDQ2NDY4MzMsInkiOjEwNC41NDIxMjkzODI5OTI1MywicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fV0sImVkZ2VzIjpbeyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMSIsImZyb20iOiJuMSIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMiIsImZyb20iOiJuMiIsInRvIjoibjMiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMyIsImZyb20iOiJuMyIsInRvIjoibjQiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im1lZGl1bSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU0IiwiZnJvbSI6Im40IiwidG8iOiJuNSIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU1IiwiZnJvbSI6Im41IiwidG8iOiJuMSIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjIsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU2IiwiZnJvbSI6Im4zIiwidG8iOiJuNiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5IjoibWVkaXVtIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTciLCJmcm9tIjoibjYiLCJ0byI6Im43IiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTgiLCJmcm9tIjoibjciLCJ0byI6Im4xIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MS41LCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlOSIsImZyb20iOiJuNyIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn1dfX0=)

**The Scenario:**

1. Initial state: High `Refinement Quality` keeps the system stable.
2. Inject a negative signal into `Refinement Quality` (simulating a "busy" sprint where refinement was skipped).
3. `Planning Clarity` drops, causing `Sprint Carryover` to rise.
4. After a **Medium Delay**, `Production Incidents` start appearing from the rushed work, creating `Failure Demand`.
5. `Failure Demand` further reduces `Refinement Quality`, while `Stakeholder Trust` drops, triggering `Management Pressure`.
6. The system enters a reinforcing loop where pressure and bugs prevent the team from ever returning to high-quality refinement.

Learning: The model shows that the only way to break the spiral is to protect `Refinement Quality` even under pressure, as it is the primary "balancing" force for planning and delivery.

## 16. "Little's Law" (The Physics of Flow)

Demonstrates the fundamental relationship between Arrival Rate, WIP, and Throughput.

```plaintext
Nodes:
  Arrival Rate (Lever)
  Work In Progress (WIP)
  Throughput (Departure Rate)
Edges:
  Arrival Rate → Work In Progress (+ polarity)
  Throughput → Work In Progress (− polarity)
  Work In Progress → Throughput (+ polarity, Delay: Medium)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiQXJyaXZhbCBSYXRlIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJXb3JrIEluIFByb2dyZXNzIiwieCI6Mjc1LjAwMDAwMDAwMDAwMDA2LCJ5Ijo1MTYuNTA2MzUwOTQ2MTA5NywicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IlRocm91Z2hwdXQiLCJ4IjoyNzQuOTk5OTk5OTk5OTk5OSwieSI6ODMuNDkzNjQ5MDUzODkwMzgsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX1dLCJlZGdlcyI6W3sia2luZCI6ImNhdXNhbCIsImlkIjoiZTEiLCJmcm9tIjoibjEiLCJ0byI6Im4yIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTIiLCJmcm9tIjoibjMiLCJ0byI6Im4yIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTMiLCJmcm9tIjoibjIiLCJ0byI6Im4zIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJtZWRpdW0iLCJ0cmFuc2ZlckZuIjoibGluZWFyIn1dfX0=)

**The Scenario:**

1. Inject signals into `Arrival Rate`. Notice `WIP` rises.
2. As `WIP` rises, it eventually drives `Throughput` (after a **Medium Delay**).
3. If `Arrival Rate` stays higher than `Throughput`, `WIP` continues to climb.

Learning: This demonstrates that `Cycle Time` is an emergent property. Even if `Throughput` is high, if `WIP` is massive, any individual "signal" (item) takes much longer to exit the system.

## 17. "The Flow Efficiency Trap" (Resource Utilization)

Demonstrates how high resource utilization (high WIP) leads to context switching, which paradoxically collapses throughput and explodes Lead Time.

```plaintext
Nodes:
  Work In Progress (WIP)
  Effective Throughput
  Context Switching / Multitasking
  Wait Time (Queue)
Edges:
  Work In Progress → Wait Time (+ polarity, Weight: 2.0)
  Work In Progress → Context Switching (+ polarity, Weight: 1.5, Delay: Short)
  Context Switching → Effective Throughput (− polarity, Weight: 2.0)
  Wait Time → Effective Throughput (− polarity)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiV29yayBJbiBQcm9ncmVzcyIsIngiOjY1MCwieSI6MzAwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMiIsImxhYmVsIjoiRWZmZWN0aXZlIFRocm91Z2hwdXQiLCJ4Ijo0MDAsInkiOjU1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IkNvbnRleHQgU3dpdGNoaW5nIC8gTXVsdGl0YXNraW5nIiwieCI6MTUwLCJ5IjozMDAuMDAwMDAwMDAwMDAwMDYsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im40IiwibGFiZWwiOiJXYWl0IFRpbWUiLCJ4IjozOTkuOTk5OTk5OTk5OTk5OTQsInkiOjUwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxIiwiZnJvbSI6Im4xIiwidG8iOiJuNCIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjIsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU0IiwiZnJvbSI6Im40IiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifV19fQ==)

**The Scenario:**

1. Slowly increase `WIP`. Initially, `Throughput` might seem stable.
2. As `WIP` crosses a threshold, the **Weight: 1.5** edge to `Context Switching` begins to dominate.
3. `Effective Throughput` begins to drop.
4. Now you have a "Death Spiral": Lower throughput means items stay in `WIP` longer, which increases `Wait Time`, which further lowers throughput.

Learning: Users see that "100% utilization" is a trap. In a system with variability, high utilization creates queues that grow exponentially (Kingman's Formula), destroying the flow metrics you were trying to optimize.

## 18. "The Team Change J-Curve" (Disruption)

Demonstrates the hidden cost of "optimizing" people by moving them between teams.

```plaintext
Nodes:
  Team Change (The Lever)
  Team Cohesion
  Productivity
  Norming & Learning
Edges:
  Team Change → Team Cohesion (− polarity, Weight: 2.0)
  Team Cohesion → Productivity (+ polarity)
  Team Change → Norming & Learning (+ polarity)
  Norming & Learning → Team Cohesion (+ polarity, Delay: Long)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiVGVhbSBDaGFuZ2UiLCJ4Ijo2NTAsInkiOjMwMCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjIiLCJsYWJlbCI6IlRlYW0gQ29oZXNpb24iLCJ4Ijo0MDAsInkiOjU1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IlByb2R1Y3Rpdml0eSIsIngiOjE1MCwieSI6MzAwLjAwMDAwMDAwMDAwMDA2LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuNCIsImxhYmVsIjoiTm9ybWluZyAmIExlYXJuaW5nIiwieCI6Mzk5Ljk5OTk5OTk5OTk5OTk0LCJ5Ijo1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fV0sImVkZ2VzIjpbeyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMSIsImZyb20iOiJuMSIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoyLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMiIsImZyb20iOiJuMiIsInRvIjoibjMiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMyIsImZyb20iOiJuMSIsInRvIjoibjQiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNCIsImZyb20iOiJuNCIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6ImxvbmciLCJ0cmFuc2ZlckZuIjoibGluZWFyIn1dfX0=)

Learning: An immediate "Team Change" causes an instant drop in `Productivity` because of the cohesion hit. The recovery only happens after the **Long Delay** of Norming, showing why frequent re-orgs keep teams in a permanent state of low productivity.

## 19. "The Hero Bottleneck" (Knowledge Silos)

Models how relying on a "rockstar" developer prevents team growth and caps long-term throughput.

```plaintext
Nodes:
  Hero Workload (Lever)
  Delivery Speed
  Team Capability
  Knowledge Sharing
Edges:
  Hero Workload → Delivery Speed (+ polarity)
  Hero Workload → Knowledge Sharing (− polarity, Weight: 1.5)
  Knowledge Sharing → Team Capability (+ polarity, Delay: Medium)
  Team Capability → Delivery Speed (+ polarity)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiSGVybyBXb3JrbG9hZCIsIngiOjY1MCwieSI6MzAwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMiIsImxhYmVsIjoiRGVsaXZlcnkgU3BlZWQiLCJ4Ijo0MDAsInkiOjU1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IlRlYW0gQ2FwYWJpbGl0eSIsIngiOjE1MCwieSI6MzAwLjAwMDAwMDAwMDAwMDA2LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuNCIsImxhYmVsIjoiS25vd2xlZGdlIFNoYXJpbmciLCJ4IjozOTkuOTk5OTk5OTk5OTk5OTQsInkiOjUwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxIiwiZnJvbSI6Im4xIiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUyIiwiZnJvbSI6Im4xIiwidG8iOiJuNCIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEuNSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTMiLCJmcm9tIjoibjQiLCJ0byI6Im4zIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJtZWRpdW0iLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNCIsImZyb20iOiJuMyIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn1dfX0=)

Learning: Injected signals into `Hero Workload` provide a quick win for `Delivery Speed`, but the negative effect on `Knowledge Sharing` ensures `Team Capability` never rises, making the Hero a permanent bottleneck.

## 20. "Perverse Incentives" (Gaming the Metric)

Showcases the "Cobra Effect" where rewarding a specific metric leads to behavior that destroys actual quality.

```plaintext
Nodes:
  Management Pressure (Lever)
  Velocity Metric
  Gaming the System
  Actual Quality
Edges:
  Management Pressure → Velocity Metric (+ polarity)
  Management Pressure → Gaming the System (+ polarity)
  Gaming the System → Velocity Metric (+ polarity) # Gaming makes the metric look better
  Gaming the System → Actual Quality (− polarity, Weight: 2.0)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiTWFuYWdlbWVudCBQcmVzc3VyZSIsIngiOjY1MCwieSI6MzAwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMiIsImxhYmVsIjoiVmVsb2NpdHkgTWV0cmljIiwieCI6NDAwLCJ5Ijo1NTAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4zIiwibGFiZWwiOiJHYW1pbmcgdGhlIFN5c3RlbSIsIngiOjE1MCwieSI6MzAwLjAwMDAwMDAwMDAwMDA2LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuNCIsImxhYmVsIjoiQWN0dWFsIFF1YWxpdHkiLCJ4IjozOTkuOTk5OTk5OTk5OTk5OTQsInkiOjUwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxIiwiZnJvbSI6Im4xIiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUyIiwiZnJvbSI6Im4xIiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUzIiwiZnJvbSI6Im4zIiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU0IiwiZnJvbSI6Im4zIiwidG8iOiJuNCIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjIsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifV19fQ==)

Learning: Users see the `Velocity Metric` climbing happily while `Actual Quality` is being destroyed by the "Gaming" loop. It visually proves that "when a measure becomes a target, it ceases to be a good measure."

## 21. "The Feature Factory" (Maintenance Debt)

Demonstrates how the "Total Cost of Ownership" of features eventually halts innovation.

```plaintext
Nodes:
  Feature Output (Lever)
  Maintenance Load
  Innovation Capacity (Initial: 10)
Edges:
  Feature Output → Maintenance Load (+ polarity, Delay: Medium)
  Maintenance Load → Innovation Capacity (− polarity)
  Innovation Capacity ⊣ Feature Output (Ceiling Constraint)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiRmVhdHVyZSBPdXRwdXQiLCJ4Ijo2NTAsInkiOjMwMCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjIiLCJsYWJlbCI6Ik1haW50ZW5hbmNlIExvYWQiLCJ4IjoyNzUuMDAwMDAwMDAwMDAwMDYsInkiOjUxNi41MDYzNTA5NDYxMDk3LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMyIsImxhYmVsIjoiSW5ub3ZhdGlvbiBDYXBhY2l0eSIsIngiOjI3NC45OTk5OTk5OTk5OTk5LCJ5Ijo4My40OTM2NDkwNTM4OTAzOCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fV0sImVkZ2VzIjpbeyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMSIsImZyb20iOiJuMSIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im1lZGl1bSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUyIiwiZnJvbSI6Im4yIiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjb25zdHJhaW50IiwiaWQiOiJlMyIsImZyb20iOiJuMyIsInRvIjoibjEiLCJjb25zdHJhaW50S2luZCI6ImNlaWxpbmcifV19fQ==)

Learning: Every new feature eventually adds to the `Maintenance Load`. Because `Innovation Capacity` is a **Ceiling** for output, the team eventually hits a wall where they can no longer ship features because they are 100% occupied by maintenance.

## 22. "The Centralized Change Trap" (Ivory Tower)

Demonstrates how decoupling change agents from the work leads to a spiral of poor policies, declining trust, and "fit-for-purpose" failure.

```plaintext
Nodes:
  Centralized Change Group (Lever)
  Distance from Work
  Sense-making Quality
  Policy Fit-for-Purpose
  Organizational Performance
  Trust in Change
Edges:
  Centralized Change Group → Distance from Work (+ polarity)
  Distance from Work → Sense-making Quality (− polarity, Weight: 2.0)
  Sense-making Quality → Policy Fit-for-Purpose (+ polarity)
  Policy Fit-for-Purpose → Organizational Performance (+ polarity, Delay: Medium)
  Policy Fit-for-Purpose → Trust in Change (+ polarity, Delay: Long)
  Organizational Performance → Centralized Change Group (− polarity)
  Trust in Change → Centralized Change Group (− polarity)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiQ2VudHJhbGl6ZWQgQ2hhbmdlIEdyb3VwIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJEaXN0YW5jZSBmcm9tIFdvcmsiLCJ4Ijo1MjUsInkiOjUxNi41MDYzNTA5NDYxMDk3LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMyIsImxhYmVsIjoiU2Vuc2UtbWFraW5nIFF1YWxpdHkiLCJ4IjoyNzUuMDAwMDAwMDAwMDAwMDYsInkiOjUxNi41MDYzNTA5NDYxMDk3LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuNCIsImxhYmVsIjoiUG9saWN5IEZpdC1mb3ItUHVycG9zZSIsIngiOjE1MCwieSI6MzAwLjAwMDAwMDAwMDAwMDA2LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuNSIsImxhYmVsIjoiT3JnYW5pemF0aW9uYWwgUGVyZm9ybWFuY2UiLCJ4IjoyNzQuOTk5OTk5OTk5OTk5OSwieSI6ODMuNDkzNjQ5MDUzODkwMzgsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im42IiwibGFiZWwiOiJUcnVzdCBpbiBDaGFuZ2UiLCJ4Ijo1MjUsInkiOjgzLjQ5MzY0OTA1Mzg5MDM1LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxIiwiZnJvbSI6Im4xIiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU2IiwiZnJvbSI6Im41IiwidG8iOiJuMSIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU3IiwiZnJvbSI6Im42IiwidG8iOiJuMSIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifV19fQ==)

**The Scenario:**

1. Inject into `Centralized Change Group` to represent a "top-down" re-org or policy push by a small, isolated team.
2. `Distance from Work` rises, causing `Sense-making Quality` to crash quickly (due to **Weight: 2.0**).
3. `Policy Fit-for-Purpose` drops, which subsequently tanks `Performance` (Medium delay) and `Trust` (Long delay).
4. Because `Performance` and `Trust` have negative edges back to the `Group`, their decline triggers even _more_ centralized activity as leadership attempts to "regain control" of the failing change.

Learning: This model surfaces the "Pathological" culture where failure leads to tighter control rather than decentralization. It highlights that the only systemic fix is to reduce the distance between decision-making and the work.

## 23. "The Invisible Sinkhole" (Hidden Work & Triage)

Demonstrates how untracked BAU and triage work steal capacity from the Sprint, eventually creating more work through Technical Debt.

```plaintext
Nodes:
  Incoming BAU / Triage (The Lever)
  Hidden Workload
  Sprint Commitment
  Feature Throughput
  Technical Debt
Edges:
  Incoming BAU / Triage → Hidden Workload (+ polarity)
  Hidden Workload → Feature Throughput (− polarity, Weight: 2.0) # Context switching penalty
  Sprint Commitment → Feature Throughput (+ polarity)
  Hidden Workload → Technical Debt (+ polarity, Delay: Long) # Rushed fixes in BAU
  Technical Debt → Incoming BAU / Triage (+ polarity, Delay: Medium) # Debt creates more triage
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiSW5jb21pbmcgQkFVIC8gVHJpYWdlIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJIaWRkZW4gV29ya2xvYWQiLCJ4Ijo0NzcuMjU0MjQ4NTkzNzM2ODYsInkiOjUzNy43NjQxMjkwNzM3ODg0LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMyIsImxhYmVsIjoiU3ByaW50IENvbW1pdG1lbnQiLCJ4IjoxOTcuNzQ1NzUxNDA2MjYzMTcsInkiOjQ0Ni45NDYzMTMwNzMxMTgzLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuNCIsImxhYmVsIjoiRmVhdHVyZSBUaHJvdWdocHV0IiwieCI6MTk3Ljc0NTc1MTQwNjI2MzE0LCJ5IjoxNTMuMDUzNjg2OTI2ODgxNzQsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im41IiwibGFiZWwiOiJUZWNobmljYWwgRGVidCIsIngiOjQ3Ny4yNTQyNDg1OTM3MzY4LCJ5Ijo2Mi4yMzU4NzA5MjYyMTE1OSwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fV0sImVkZ2VzIjpbeyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMSIsImZyb20iOiJuMSIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMiIsImZyb20iOiJuMiIsInRvIjoibjQiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoyLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMyIsImZyb20iOiJuMyIsInRvIjoibjQiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNCIsImZyb20iOiJuMiIsInRvIjoibjUiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6ImxvbmciLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNSIsImZyb20iOiJuNSIsInRvIjoibjEiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im1lZGl1bSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifV19fQ==)

**The Scenario:**

1. Inject into `Incoming BAU / Triage`. Notice the `Feature Throughput` drops immediately.
2. Because the weight is **2.0**, every unit of "Hidden Work" feels like two units of lost progress due to the context-switching cost.
3. As the `Hidden Workload` stays high, the team starts rushing fixes to get back to their `Sprint Commitment`.
4. After a **Long Delay**, the `Technical Debt` signal arrives.
5. This debt then feeds back into `Incoming BAU / Triage` (Medium Delay), creating a "vicious cycle" where the team is doing more and more "Hidden Work" just to keep the lights on.

Learning: This model helps stakeholders understand that "just a quick triage" isn't free. It surfaces the fact that untracked work is the primary driver of technical debt and declining feature velocity.

## 24. "The Homeostasis Trap" (Resistance to Change)

Demonstrates how systems naturally resist improvement and return to "Old Habits" unless effort is sustained long enough to create new standards.

```plaintext
Nodes:
  Improvement Effort (The Lever)
  New Capability (Stock)
  Old Habits / Entropy (The Default State)
  Standardization (The Stabilizer)
Edges:
  Improvement Effort → New Capability (+ polarity)
  New Capability → Old Habits (− polarity, Weight: 1.5)
  Old Habits → New Capability (− polarity, Weight: 2.5) # The "Push Back"
  New Capability → Standardization (+ polarity, Delay: Long)
  Standardization → Old Habits (− polarity, Weight: 2.0)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiSW1wcm92ZW1lbnQgRWZmb3J0IiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJOZXcgQ2FwYWJpbGl0eSIsIngiOjQwMCwieSI6NTUwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMyIsImxhYmVsIjoiT2xkIEhhYml0cyAvIEVudHJvcHkiLCJ4IjoxNTAsInkiOjMwMC4wMDAwMDAwMDAwMDAwNiwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjQiLCJsYWJlbCI6IlN0YW5kYXJkaXphdGlvbiIsIngiOjM5OS45OTk5OTk5OTk5OTk5NCwieSI6NTAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX1dLCJlZGdlcyI6W3sia2luZCI6ImNhdXNhbCIsImlkIjoiZTEiLCJmcm9tIjoibjEiLCJ0byI6Im4yIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTQiLCJmcm9tIjoibjIiLCJ0byI6Im40IiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJsb25nIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9XX19)

**The Scenario:**

1. Inject a few signals into `Improvement Effort`. You'll see `New Capability` rise slightly, but `Old Habits` (which starts high) will immediately pull it back down because of its higher **Weight (2.5)**.
2. To actually succeed, you must flood `Improvement Effort` with sustained signals.
3. If you stop too early, the system reverts.
4. Only if you sustain effort long enough for the **Long Delay** on the `Standardization` edge to trigger will the `Old Habits` be permanently suppressed.

Learning: This model visualizes why "Continuous Improvement" isn't a project with an end date—it's a battle against the system's natural gravity. It highlights that **Standardization** is the "ratchet" that prevents the system from sliding backward, but it takes the longest to build.

## 25. "OKRs as MBOs" (The Fixed-Plan Trap)

Demonstrates the "Command & Control" failure mode where OKRs are used to push fixed initiatives, leading to high activity but low actual value and metric gaming.

```plaintext
Nodes:
  Fixed Initiatives (The Lever)
  Management Pressure
  Busy-ness / Output
  Actual Value / Outcome
  Gaming the Metric
Edges:
  Fixed Initiatives → Busy-ness / Output (+ polarity)
  Busy-ness / Output → Actual Value / Outcome (+ polarity, Delay: Long)
  Management Pressure → Fixed Initiatives (+ polarity)
  Management Pressure → Gaming the Metric (+ polarity, Weight: 2.0)
  Gaming the Metric → Busy-ness / Output (+ polarity) # Looks like progress!
  Gaming the Metric → Actual Value / Outcome (− polarity, Weight: 1.5)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiRml4ZWQgSW5pdGlhdGl2ZXMiLCJ4Ijo2NTAsInkiOjMwMCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjIiLCJsYWJlbCI6Ik1hbmFnZW1lbnQgUHJlc3N1cmUiLCJ4Ijo0NzcuMjU0MjQ4NTkzNzM2ODYsInkiOjUzNy43NjQxMjkwNzM3ODg0LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMyIsImxhYmVsIjoiQnVzeS1uZXNzIC8gT3V0cHV0IiwieCI6MTk3Ljc0NTc1MTQwNjI2MzE3LCJ5Ijo0NDYuOTQ2MzEzMDczMTE4MywicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjQiLCJsYWJlbCI6IkFjdHVhbCBWYWx1ZSAvIE91dGNvbWUiLCJ4IjoxOTcuNzQ1NzUxNDA2MjYzMTQsInkiOjE1My4wNTM2ODY5MjY4ODE3NCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjUiLCJsYWJlbCI6IkdhbWluZyB0aGUgTWV0cmljIiwieCI6NDc3LjI1NDI0ODU5MzczNjgsInkiOjYyLjIzNTg3MDkyNjIxMTU5LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUzIiwiZnJvbSI6Im4yIiwidG8iOiJuMSIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU0IiwiZnJvbSI6Im4yIiwidG8iOiJuNSIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjIsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU2IiwiZnJvbSI6Im41IiwidG8iOiJuNCIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEuNSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9XX19)

**The Scenario:**

1. Injecting into `Fixed Initiatives` creates immediate `Busy-ness`.
2. Because the initiative is fixed (not validated), the `Actual Value` only rises after a **Long Delay** (if at all).
3. As deadlines approach, `Management Pressure` increases, which drives `Gaming` behavior.
4. The `Gaming` makes the `Busy-ness` (the metric) look even better, but it actively harms `Actual Value`.

Learning: This model shows how top-down pressure on fixed tasks creates a disconnect between perceived progress and actual outcomes, often resulting in "success on paper, failure in reality."

## 26. "OKRs as Enabling Constraints" (Decentralized Flow)

Showcases how outcome-based OKRs act as guardrails that empower team autonomy and faster learning.

```plaintext
Nodes:
  Outcome-based OKR (The Lever)
  Team Experiments / Initiatives
  Strategic Alignment
  Value Created
  Sense-making / Learning
  Waste / Distraction
Edges:
  Outcome-based OKR → Strategic Alignment (+ polarity)
  Strategic Alignment → Team Experiments / Initiatives (+ polarity)
  Team Experiments / Initiatives → Value Created (+ polarity, Delay: Short) # Pivot fast!
  Value Created → Sense-making / Learning (+ polarity)
  Sense-making / Learning → Outcome-based OKR (+ polarity) # Refine the goal
  Outcome-based OKR ⊣ Waste / Distraction (Ceiling Constraint)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiT3V0Y29tZS1iYXNlZCBPS1IiLCJ4Ijo2NTAsInkiOjMwMCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjIiLCJsYWJlbCI6IlRlYW0gRXhwZXJpbWVudHMgLyBJbml0aWF0aXZlcyIsIngiOjUyNSwieSI6NTE2LjUwNjM1MDk0NjEwOTcsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4zIiwibGFiZWwiOiJTdHJhdGVnaWMgQWxpZ25tZW50IiwieCI6Mjc1LjAwMDAwMDAwMDAwMDA2LCJ5Ijo1MTYuNTA2MzUwOTQ2MTA5NywicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjQiLCJsYWJlbCI6IlZhbHVlIENyZWF0ZWQiLCJ4IjoxNTAsInkiOjMwMC4wMDAwMDAwMDAwMDAwNiwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjUiLCJsYWJlbCI6IlNlbnNlLW1ha2luZyAvIExlYXJuaW5nIiwieCI6Mjc0Ljk5OTk5OTk5OTk5OTksInkiOjgzLjQ5MzY0OTA1Mzg5MDM4LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuNiIsImxhYmVsIjoiV2FzdGUgLyBEaXN0cmFjdGlvbiIsIngiOjUyNSwieSI6ODMuNDkzNjQ5MDUzODkwMzUsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX1dLCJlZGdlcyI6W3sia2luZCI6ImNhdXNhbCIsImlkIjoiZTIiLCJmcm9tIjoibjMiLCJ0byI6Im4yIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTMiLCJmcm9tIjoibjIiLCJ0byI6Im40IiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJzaG9ydCIsInRyYW5zZmVyRm4iOiJsaW5lYXIifV19fQ==)

**The Scenario:**

1. The `Outcome-based OKR` provides the `Strategic Alignment` for the team to run their own `Experiments`.
2. Because experiments are small, the **Delay** to `Value Created` is **Short**, allowing for rapid `Sense-making`.
3. Crucially, the OKR acts as a **Ceiling Constraint** on `Waste / Distraction`. If an activity doesn't move the KR, the "Guardrail" prevents it from consuming capacity.

Learning: By shifting the focus from "doing the plan" to "moving the needle," the system gains a fast feedback loop. The OKR isn't a target to be "hit" at all costs, but a boundary that keeps autonomy focused on value.

## 27. "The Team Performance Curve" (The Pseudo-Team Dip)

Demonstrates the transition from a Working Group to a Real Team, highlighting the "Pseudo-team" state where performance actually drops due to overhead without alignment.

```plaintext
Nodes:
  Team Formation (The Lever)
  Communication Overhead
  Shared Purpose
  Team Performance
Edges:
  Team Formation → Communication Overhead (+ polarity, Weight: 2.0)
  Communication Overhead → Team Performance (− polarity)
  Team Formation → Shared Purpose (+ polarity, Delay: Long)
  Shared Purpose → Team Performance (+ polarity, Weight: 3.0)
  Shared Purpose ⊣ Communication Overhead (Ceiling Constraint) # Alignment reduces waste
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiVGVhbSBGb3JtYXRpb24iLCJ4Ijo2NTAsInkiOjMwMCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjIiLCJsYWJlbCI6IkNvbW11bmljYXRpb24gT3ZlcmhlYWQiLCJ4Ijo0MDAsInkiOjU1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IlNoYXJlZCBQdXJwb3NlIiwieCI6MTUwLCJ5IjozMDAuMDAwMDAwMDAwMDAwMDYsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im40IiwibGFiZWwiOiJUZWFtIFBlcmZvcm1hbmNlIiwieCI6Mzk5Ljk5OTk5OTk5OTk5OTk0LCJ5Ijo1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fV0sImVkZ2VzIjpbeyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMSIsImZyb20iOiJuMSIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoyLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMiIsImZyb20iOiJuMiIsInRvIjoibjQiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMyIsImZyb20iOiJuMSIsInRvIjoibjMiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6ImxvbmciLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNCIsImZyb20iOiJuMyIsInRvIjoibjQiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjozLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY29uc3RyYWludCIsImlkIjoiZTUiLCJmcm9tIjoibjMiLCJ0byI6Im4yIiwiY29uc3RyYWludEtpbmQiOiJjZWlsaW5nIn1dfX0=)

**The Scenario:**

1. Inject into `Team Formation`. `Communication Overhead` spikes immediately, causing `Team Performance` to drop. This is the **Pseudo-team** state.
2. Because `Shared Purpose` has a **Long Delay**, the performance remains low for a while.
3. Once `Shared Purpose` finally rises, it acts as a **Ceiling Constraint** on `Overhead` (focusing communication) and provides a massive **Weight: 3.0** boost to `Performance`.

Learning: Users see that the "dip" is structural. A pseudo-team is worse than a working group because it has the overhead of a team without the alignment of a common goal.

## 28. "Social Loafing" (The Ringelmann Effect)

Showcases how "Working Groups" fail to scale compared to "Real Teams" due to the diffusion of responsibility.

```plaintext
Nodes:
  Group Size (The Lever)
  Individual Accountability
  Individual Effort
  Total Output
  Mutual Accountability (Real Team Factor)
Edges:
  Group Size → Individual Accountability (− polarity, Weight: 1.5)
  Individual Accountability → Individual Effort (+ polarity)
  Individual Effort → Total Output (+ polarity)
  Mutual Accountability → Individual Accountability (+ polarity, Weight: 2.0)
  Group Size → Mutual Accountability (+ polarity, Delay: Medium)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiR3JvdXAgU2l6ZSIsIngiOjY1MCwieSI6MzAwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMiIsImxhYmVsIjoiSW5kaXZpZHVhbCBBY2NvdW50YWJpbGl0eSIsIngiOjQ3Ny4yNTQyNDg1OTM3MzY4NiwieSI6NTM3Ljc2NDEyOTA3Mzc4ODQsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4zIiwibGFiZWwiOiJJbmRpdmlkdWFsIEVmZm9ydCIsIngiOjE5Ny43NDU3NTE0MDYyNjMxNywieSI6NDQ2Ljk0NjMxMzA3MzExODMsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im40IiwibGFiZWwiOiJUb3RhbCBPdXRwdXQiLCJ4IjoxOTcuNzQ1NzUxNDA2MjYzMTQsInkiOjE1My4wNTM2ODY5MjY4ODE3NCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjUiLCJsYWJlbCI6Ik11dHVhbCBBY2NvdW50YWJpbGl0eSIsIngiOjQ3Ny4yNTQyNDg1OTM3MzY4LCJ5Ijo2Mi4yMzU4NzA5MjYyMTE1OSwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fV0sImVkZ2VzIjpbeyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMSIsImZyb20iOiJuMSIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLjUsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUyIiwiZnJvbSI6Im4yIiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUzIiwiZnJvbSI6Im4zIiwidG8iOiJuNCIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU0IiwiZnJvbSI6Im41IiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjIsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU1IiwiZnJvbSI6Im4xIiwidG8iOiJuNSIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5IjoibWVkaXVtIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9XX19)

**The Scenario:**

1. Increase `Group Size`. In a **Working Group** (no mutual accountability), you see `Individual Effort` drop as the group grows—the classic "Social Loafing" effect.
2. If you inject into `Mutual Accountability` (the "Real Team" shift), it offsets the negative pressure of size, restoring individual effort and causing `Total Output` to scale.

Learning: This model visualizes the difference between a group of individuals and a cohesive unit. In a real team, the "Mutual Accountability" loop prevents the diffusion of responsibility.

## 29. "Collective Accountability" (Real Team Multiplier)

Demonstrates how a "Real Team" creates a reinforcing loop between results and trust that a "Pseudo-team" cannot access.

```plaintext
Nodes:
  Common Purpose (The Lever)
  Complementary Skills
  Collective Work Product
  Mutual Accountability
  Team Results
Edges:
  Common Purpose → Mutual Accountability (+ polarity)
  Complementary Skills → Collective Work Product (+ polarity)
  Mutual Accountability → Collective Work Product (+ polarity)
  Collective Work Product → Team Results (+ polarity, Weight: 2.0)
  Team Results → Mutual Accountability (+ polarity, Delay: Medium)
  Common Purpose ⌊ Mutual Accountability (Floor Constraint)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiQ29tbW9uIFB1cnBvc2UiLCJ4Ijo2NTAsInkiOjMwMCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjIiLCJsYWJlbCI6IkNvbXBsZW1lbnRhcnkgU2tpbGxzIiwieCI6NDc3LjI1NDI0ODU5MzczNjg2LCJ5Ijo1MzcuNzY0MTI5MDczNzg4NCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IkNvbGxlY3RpdmUgV29yayBQcm9kdWN0IiwieCI6MTk3Ljc0NTc1MTQwNjI2MzE3LCJ5Ijo0NDYuOTQ2MzEzMDczMTE4MywicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjQiLCJsYWJlbCI6Ik11dHVhbCBBY2NvdW50YWJpbGl0eSIsIngiOjE5Ny43NDU3NTE0MDYyNjMxNCwieSI6MTUzLjA1MzY4NjkyNjg4MTc0LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuNSIsImxhYmVsIjoiVGVhbSBSZXN1bHRzIiwieCI6NDc3LjI1NDI0ODU5MzczNjgsInkiOjYyLjIzNTg3MDkyNjIxMTU5LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxIiwiZnJvbSI6Im4xIiwidG8iOiJuNCIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUyIiwiZnJvbSI6Im4yIiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUzIiwiZnJvbSI6Im40IiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU0IiwiZnJvbSI6Im4zIiwidG8iOiJuNSIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjIsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU1IiwiZnJvbSI6Im41IiwidG8iOiJuNCIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5IjoibWVkaXVtIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNvbnN0cmFpbnQiLCJpZCI6ImU2IiwiZnJvbSI6Im4xIiwidG8iOiJuNCIsImNvbnN0cmFpbnRLaW5kIjoiZmxvb3IifV19fQ==)

Learning: The `Common Purpose` acts as a **Floor Constraint**, ensuring that even when things go poorly, `Mutual Accountability` doesn't crash to zero. This "safety net" allows the reinforcing loop of `Results → Accountability` to build momentum, leading to a High-Performance Team state.

## 27. "The 5 Dysfunctions of a Team" (Lencioni's Pyramid)

Demonstrates the hierarchical dependencies of team health: Trust, Conflict, Commitment, Accountability, and Results.

```plaintext
Nodes:
  Vulnerability-based Trust (The Foundation / Lever)
  Healthy Conflict
  Commitment / Buy-in
  Peer Accountability
  Collective Team Results
Edges:
  Trust → Healthy Conflict (+ polarity, Weight: 2.0)
  Healthy Conflict → Commitment / Buy-in (+ polarity, Delay: Short)
  Commitment / Buy-in → Peer Accountability (+ polarity)
  Peer Accountability → Collective Team Results (+ polarity)
  Collective Team Results → Trust (+ polarity, Delay: Long) # Success builds trust
  Trust ⊣ Peer Accountability (Ceiling Constraint) # Foundation constraint
  Commitment / Buy-in ⊣ Collective Team Results (Ceiling Constraint)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiVnVsbmVyYWJpbGl0eS1iYXNlZCBUcnVzdCIsIngiOjY1MCwieSI6MzAwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMiIsImxhYmVsIjoiSGVhbHRoeSBDb25mbGljdCIsIngiOjQ3Ny4yNTQyNDg1OTM3MzY4NiwieSI6NTM3Ljc2NDEyOTA3Mzc4ODQsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4zIiwibGFiZWwiOiJDb21taXRtZW50IC8gQnV5LWluIiwieCI6MTk3Ljc0NTc1MTQwNjI2MzE3LCJ5Ijo0NDYuOTQ2MzEzMDczMTE4MywicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjQiLCJsYWJlbCI6IlBlZXIgQWNjb3VudGFiaWxpdHkiLCJ4IjoxOTcuNzQ1NzUxNDA2MjYzMTQsInkiOjE1My4wNTM2ODY5MjY4ODE3NCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjUiLCJsYWJlbCI6IkNvbGxlY3RpdmUgVGVhbSBSZXN1bHRzIiwieCI6NDc3LjI1NDI0ODU5MzczNjgsInkiOjYyLjIzNTg3MDkyNjIxMTU5LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU0IiwiZnJvbSI6Im40IiwidG8iOiJuNSIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifV19fQ==)

**The Scenario:**

1. Inject signals into `Trust`. Notice how the "wave" of health propagates upward.
2. `Trust` amplifies `Healthy Conflict`. Without trust, conflict stays at 0 (Artificial Harmony).
3. `Healthy Conflict` leads to `Commitment`.
4. Notice the **Ceiling Constraints**: Even if you try to "inject" signals directly into `Peer Accountability` (e.g., via management decree), the `Trust` node will cap its effectiveness. You cannot have high accountability in a low-trust environment.
5. Eventually, `Collective Team Results` feeds back into `Trust` (Long Delay), showing how sustained success reinforces the foundation.

Learning: This model visually proves that you cannot "fix" results or accountability by looking at the top of the pyramid. You must address the foundational dysfunctions—starting with Trust—to allow the system to flow.

## 30. "The Boy Scout Rule" (Refactoring vs. Speed)

Demonstrates the non-linear relationship between code health and feature velocity.

```plaintext
Nodes:
  Feature Pressure (Lever)
  Refactoring Effort
  Code Complexity (Stock)
  Feature Velocity
Edges:
  Feature Pressure → Feature Velocity (+ polarity)
  Feature Pressure → Refactoring Effort (− polarity, Weight: 2.0)
  Refactoring Effort → Code Complexity (− polarity, Delay: Medium)
  Feature Velocity → Code Complexity (+ polarity)
  Code Complexity → Feature Velocity (− polarity, Weight: 3.0)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiRmVhdHVyZSBQcmVzc3VyZSIsIngiOjY1MCwieSI6MzAwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMiIsImxhYmVsIjoiUmVmYWN0b3JpbmcgRWZmb3J0IiwieCI6NDAwLCJ5Ijo1NTAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4zIiwibGFiZWwiOiJDb2RlIENvbXBsZXhpdHkiLCJ4IjoxNTAsInkiOjMwMC4wMDAwMDAwMDAwMDAwNiwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjQiLCJsYWJlbCI6IkZlYXR1cmUgVmVsb2NpdHkiLCJ4IjozOTkuOTk5OTk5OTk5OTk5OTQsInkiOjUwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxIiwiZnJvbSI6Im4xIiwidG8iOiJuNCIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUyIiwiZnJvbSI6Im4xIiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjIsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUzIiwiZnJvbSI6Im4yIiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5IjoibWVkaXVtIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTQiLCJmcm9tIjoibjQiLCJ0byI6Im4zIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTUiLCJmcm9tIjoibjMiLCJ0byI6Im40IiwicG9sYXJpdHkiOjEsIndlaWdodCI6MywiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9XX19)

Learning: Under pressure, teams cut refactoring. This causes `Code Complexity` to rise. Because complexity has a high **Weight (3.0)** on slowing down velocity, the team eventually ends up slower than if they had maintained their refactoring effort.

## 31. "Cost of Delay" (Decision Latency)

Uses Delays to show how waiting for stakeholder decisions kills the "Agile" advantage.

```plaintext
Nodes:
  Dev Readiness (Lever)
  Decision Wait Time
  WIP (Unfinished Value)
  Value Realized
Edges:
  Dev Readiness → Decision Wait Time (+ polarity, Delay: Long)
  Decision Wait Time → WIP (+ polarity)
  WIP → Value Realized (− polarity, Weight: 2.0)
  Decision Wait Time → Value Realized (− polarity, Weight: 3.0)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiRGV2IFJlYWRpbmVzcyIsIngiOjY1MCwieSI6MzAwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuMiIsImxhYmVsIjoiRGVjaXNpb24gV2FpdCBUaW1lIiwieCI6NDAwLCJ5Ijo1NTAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4zIiwibGFiZWwiOiJXSVAiLCJ4IjoxNTAsInkiOjMwMC4wMDAwMDAwMDAwMDAwNiwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjQiLCJsYWJlbCI6IlZhbHVlIFJlYWxpemVkIiwieCI6Mzk5Ljk5OTk5OTk5OTk5OTk0LCJ5Ijo1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fV0sImVkZ2VzIjpbeyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMSIsImZyb20iOiJuMSIsInRvIjoibjIiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6ImxvbmciLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMiIsImZyb20iOiJuMiIsInRvIjoibjMiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlMyIsImZyb20iOiJuMyIsInRvIjoibjQiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoyLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNCIsImZyb20iOiJuMiIsInRvIjoibjQiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjozLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn1dfX0=)

Learning: The long delay on decisions creates a "Value Gap." Users see that even if developers are ready, the `Value Realized` crashes because the decisions (the "Enabling Constraint") are stuck in a queue.

## 32. "Theory of Constraints" (The Drum-Buffer-Rope)

Proves that the system output is governed solely by the bottleneck.

```plaintext
Nodes:
  Step A (Lever)
  Step B (The Bottleneck, Max: 5)
  Step C
  Total System Throughput
Edges:
  Step A → Step B (+ polarity)
  Step B → Step C (+ polarity)
  Step C → Total System Throughput (+ polarity)
  Step B ⊣ Total System Throughput (Ceiling Constraint)
```

[Open Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiU3RlcCBBIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJTdGVwIEIiLCJ4Ijo0MDAsInkiOjU1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IlN0ZXAgQyIsIngiOjE1MCwieSI6MzAwLjAwMDAwMDAwMDAwMDA2LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuNCIsImxhYmVsIjoiVG90YWwgU3lzdGVtIFRocm91Z2hwdXQiLCJ4IjozOTkuOTk5OTk5OTk5OTk5OTQsInkiOjUwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9XSwiZWRnZXMiOlt7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxIiwiZnJvbSI6Im4xIiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUyIiwiZnJvbSI6Im4yIiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUzIiwiZnJvbSI6Im4zIiwidG8iOiJuNCIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjb25zdHJhaW50IiwiaWQiOiJlNCIsImZyb20iOiJuMiIsInRvIjoibjQiLCJjb25zdHJhaW50S2luZCI6ImNlaWxpbmcifV19fQ==)

Learning: No matter how much you "optimize" Step A or Step C (injecting signals), the `Total System Throughput` is physically pinned to the `Step B` ceiling. This is the visual proof of Goldratt’s "The Goal."

## 33. "Water-Scrum-Fall" (The Agile Sandwich)

Demonstrates how agile "speed" is wasted if the boundaries are rigid.

```plaintext
Nodes:
  Annual Planning (The Lever)
  Agile Team Velocity
  Deployment Frequency (The Constraint Source, Initial: 2)
  Value in Production
Edges:
  Annual Planning → Agile Team Velocity (+ polarity, Delay: Long)
  Agile Team Velocity → Value in Production (+ polarity)
  Deployment Frequency ⊣ Value in Production (Ceiling Constraint)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiQW5udWFsIFBsYW5uaW5nIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJBZ2lsZSBUZWFtIFZlbG9jaXR5IiwieCI6NDAwLCJ5Ijo1NTAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4zIiwibGFiZWwiOiJEZXBsb3ltZW50IEZyZXF1ZW5jeSIsIngiOjE1MCwieSI6MzAwLjAwMDAwMDAwMDAwMDA2LCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuNCIsImxhYmVsIjoiVmFsdWUgaW4gUHJvZHVjdGlvbiIsIngiOjM5OS45OTk5OTk5OTk5OTk5NCwieSI6NTAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX1dLCJlZGdlcyI6W3sia2luZCI6ImNhdXNhbCIsImlkIjoiZTEiLCJmcm9tIjoibjEiLCJ0byI6Im4yIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJsb25nIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTIiLCJmcm9tIjoibjIiLCJ0byI6Im40IiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNvbnN0cmFpbnQiLCJpZCI6ImUzIiwiZnJvbSI6Im4zIiwidG8iOiJuNCIsImNvbnN0cmFpbnRLaW5kIjoiY2VpbGluZyJ9XX19)

Learning: The `Agile Team` might be incredibly fast, but the `Value in Production` is capped by the `Deployment Frequency`. The team builds up massive "Inventory" (WIP) that can't be released, highlighting the need for DevOps/CD rather than just "faster coding."

## 34. "DORA Metrics: The Speed/Stability Balance"

Demonstrates the relationship between the four key DORA metrics, showing how speed and stability can either undermine or reinforce each other depending on the level of automated safety.

```plaintext
Nodes:
  Deployment Frequency (The Lever)
  Lead Time for Changes
  Change Failure Rate
  Time to Restore Service
  Automated Safety & Tests (The Stabilizer)
Edges:
  Deployment Frequency → Lead Time for Changes (− polarity)
  Deployment Frequency → Change Failure Rate (+ polarity, Weight: 2.0) # Speed carries risk
  Automated Safety & Tests → Change Failure Rate (− polarity, Weight: 3.0) # Safety mitigates risk
  Automated Safety & Tests → Deployment Frequency (+ polarity, Delay: Medium) # Confidence enables speed
  Change Failure Rate → Time to Restore Service (+ polarity)
  Time to Restore Service → Deployment Frequency (− polarity, Weight: 2.0) # Recovery steals capacity
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiRGVwbG95bWVudCBGcmVxdWVuY3kiLCJ4Ijo2NTAsInkiOjMwMCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjIiLCJsYWJlbCI6IkxlYWQgVGltZSBmb3IgQ2hhbmdlcyIsIngiOjQ3Ny4yNTQyNDg1OTM3MzY4NiwieSI6NTM3Ljc2NDEyOTA3Mzc4ODQsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4zIiwibGFiZWwiOiJDaGFuZ2UgRmFpbHVyZSBSYXRlIiwieCI6MTk3Ljc0NTc1MTQwNjI2MzE3LCJ5Ijo0NDYuOTQ2MzEzMDczMTE4MywicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjQiLCJsYWJlbCI6IlRpbWUgdG8gUmVzdG9yZSBTZXJ2aWNlIiwieCI6MTk3Ljc0NTc1MTQwNjI2MzE0LCJ5IjoxNTMuMDUzNjg2OTI2ODgxNzQsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im41IiwibGFiZWwiOiJBdXRvbWF0ZWQgU2FmZXR5ICYgVGVzdHMiLCJ4Ijo0NzcuMjU0MjQ4NTkzNzM2OCwieSI6NjIuMjM1ODcwOTI2MjExNTksInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX1dLCJlZGdlcyI6W3sia2luZCI6ImNhdXNhbCIsImlkIjoiZTEiLCJmcm9tIjoibjEiLCJ0byI6Im4yIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTIiLCJmcm9tIjoibjEiLCJ0byI6Im4zIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MiwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTMiLCJmcm9tIjoibjUiLCJ0byI6Im4zIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MywiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTQiLCJmcm9tIjoibjUiLCJ0byI6Im4xIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJtZWRpdW0iLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNSIsImZyb20iOiJuMyIsInRvIjoibjQiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNiIsImZyb20iOiJuNCIsInRvIjoibjEiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoyLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn1dfX0=)

**Scenario A: "Move Fast and Break Things"**
Neglect `Automated Safety & Tests`. Inject into `Deployment Frequency`. You'll see `Lead Time` drop (good!), but `Change Failure Rate` and `Time to Restore Service` will skyrocket. Eventually, the negative feedback from restoration effort will crash your `Deployment Frequency`.

**Scenario B: Elite Performance (The Virtuous Cycle)**
Invest heavily in `Automated Safety & Tests`. Now, as you increase `Deployment Frequency`, the `Change Failure Rate` stays low because of the strong balancing edge from Safety. The increased confidence and lower failure demand actually allow `Deployment Frequency` to rise even higher over time.

Learning: High performance is not a trade-off between speed and stability; it's a state where speed enables stability (via smaller batches) and stability enables speed (via confidence and low failure demand).

## 35. "The Planning Trap" (Estimation & Replanning)

Demonstrates how the quest for "certainty" through estimation and replanning can steal the capacity required to actually finish the work.

```plaintext
Nodes:
  Deadline Gap (The Lever)
  Management Pressure
  Planning & Estimation Effort
  Actual Development Time
  Progress Rate
Edges:
  Deadline Gap → Management Pressure (+ polarity)
  Management Pressure → Planning & Estimation Effort (+ polarity, Weight: 2.0)
  Planning & Estimation Effort → Actual Development Time (− polarity, Weight: 1.5)
  Actual Development Time → Progress Rate (+ polarity)
  Progress Rate → Deadline Gap (− polarity, Delay: Medium)
  Planning & Estimation Effort → Management Pressure (− polarity, Delay: Short) # The "Illusion of Control"
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjoxLCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiRGVhZGxpbmUgR2FwIiwieCI6NjUwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX0seyJpZCI6Im4yIiwibGFiZWwiOiJNYW5hZ2VtZW50IFByZXNzdXJlIiwieCI6NDc3LjI1NDI0ODU5MzczNjg2LCJ5Ijo1MzcuNzY0MTI5MDczNzg4NCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjMiLCJsYWJlbCI6IlBsYW5uaW5nICYgRXN0aW1hdGlvbiBFZmZvcnQiLCJ4IjoxOTcuNzQ1NzUxNDA2MjYzMTcsInkiOjQ0Ni45NDYzMTMwNzMxMTgzLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAsImluaXRpYWwiOjV9LHsiaWQiOiJuNCIsImxhYmVsIjoiQWN0dWFsIERldmVsb3BtZW50IFRpbWUiLCJ4IjoxOTcuNzQ1NzUxNDA2MjYzMTQsInkiOjE1My4wNTM2ODY5MjY4ODE3NCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwLCJpbml0aWFsIjo1fSx7ImlkIjoibjUiLCJsYWJlbCI6IlByb2dyZXNzIFJhdGUiLCJ4Ijo0NzcuMjU0MjQ4NTkzNzM2OCwieSI6NjIuMjM1ODcwOTI2MjExNTksInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMCwiaW5pdGlhbCI6NX1dLCJlZGdlcyI6W3sia2luZCI6ImNhdXNhbCIsImlkIjoiZTEiLCJmcm9tIjoibjEiLCJ0byI6Im4yIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTIiLCJmcm9tIjoibjIiLCJ0byI6Im4zIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MiwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTMiLCJmcm9tIjoibjMiLCJ0byI6Im40IiwicG9sYXJpdHkiOjEsIndlaWdodCI6MS41LCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNCIsImZyb20iOiJuNCIsInRvIjoibjUiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiaWQiOiJlNSIsImZyb20iOiJuNSIsInRvIjoibjEiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im1lZGl1bSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU2IiwiZnJvbSI6Im4zIiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoic2hvcnQiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn1dfX0=)

**The Scenario:**

1. Inject into `Deadline Gap` (representing a project slipping).
2. `Management Pressure` rises, which triggers a demand for more `Planning & Estimation`.
3. Notice the **Delay: Short** edge from Planning back to Pressure. This represents the "Quick Fix": the act of planning makes stakeholders feel better immediately, even though no work has been done.
4. However, the high **Weight: 1.5** negative edge to `Actual Development Time` shows the cost. Every hour spent estimating is an hour not spent building.
5. As development time drops, the `Progress Rate` slows, which (after a **Medium Delay**) causes the `Deadline Gap` to widen even further.

Learning: This model surfaces the "Analysis Paralysis" death spiral. It visually proves that beyond a certain point, more planning is counter-productive because it attacks the only variable that actually closes the gap: development time.

## 36. "The Quality vs. Velocity Trap" (Quick Fixes & Technical Debt)

Demonstrates how organizations respond to pressure by sacrificing quality for short-term velocity gains, triggering a crisis-recovery cycle that reveals the hidden cost of technical debt.

```plaintext
Nodes:
  Pressure (The Lever)
  Velocity
  Defects
  Quality
  Cheap Hiring
  Low-skill Devs
  Great Programmers
  Mentoring Capacity
Edges:
  Pressure → Cheap Hiring (+ polarity, Delay: Short)
  Cheap Hiring → Low-skill Devs (+ polarity)
  Low-skill Devs → Defects (+ polarity, Weight: 1.5, Delay: Short)
  Defects → Quality (− polarity, Delay: Medium)
  Quality → Velocity (+ polarity)
  Pressure → Velocity (+ polarity, Delay: Short) # Quick-fix path: short-term win
  Defects → Pressure (+ polarity, Weight: 0.5, Delay: Medium) # Delayed consequence feedback
  Velocity → Great Programmers (+ polarity)
  Great Programmers → Mentoring Capacity (+ polarity, Delay: Medium)
  Mentoring Capacity → Quality (+ polarity)
  Mentoring Capacity → Low-skill Devs (− polarity, Weight: 0.5)
  Quality → Great Programmers (+ polarity)
```

[Open in Swoopy](http://localhost:5173/?g=eyJ2ZXJzaW9uIjo0LCJncmFwaCI6eyJub2RlcyI6W3siaWQiOiJuMSIsImxhYmVsIjoiUHJlc3N1cmUiLCJ4Ijo2NTAsInk6MzAwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAwLCJpbml0aWFsIjoyMH0seyJpZCI6Im4yIiwibGFiZWwiOiJWZWxvY2l0eSIsIng6NDAwLCJ5Ijo1NTAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMDAsImluaXRpYWwiOjUwfSx7ImlkIjoibjMiLCJsYWJlbCI6IkRlZmVjdHMiLCJ4IjoxNTAsInk6MzAwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAwLCJpbml0aWFsIjoyMH0seyJpZCI6Im40IiwibGFiZWwiOiJRdWFsaXR5IiwieCI6NDAwLCJ5Ijo1MCwicmFkaXVzIjo1MCwibWluIjowLCJtYXgiOjEwMCwiaW5pdGlhbCI6NzB9LHsiaWQiOiJuNSIsImxhYmVsIjoiQ2hlYXAgSGlyaW5nIiwieCI6OTAwLCJ5IjozMDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMDAsImluaXRpYWwiOjB9LHsiaWQiOiJuNiIsImxhYmVsIjoiTG93LXNraWxsIERldnMiLCJ4Ijo5MDAsInk6NTUwLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAwLCJpbml0aWFsIjoyMH0seyJpZCI6Im43IiwibGFiZWwiOiJHcmVhdCBQcm9ncmFtbWVycyIsIng6NDAwLCJ5Ijo4MDAsInJhZGl1cyI6NTAsIm1pbiI6MCwibWF4IjoxMDAsImluaXRpYWwiOjU0fSx7ImlkIjoibjgiLCJsYWJlbCI6Ik1lbnRvcmluZyBDYXBhY2l0eSIsIng6MTE1MCwieTpaww0iLCJyYWRpdXMiOjUwLCJtaW4iOjAsIm1heCI6MTAwLCJpbml0aWFsIjo2MH1dLCJlZGdlcyI6W3sia2luZCI6ImNhdXNhbCIsImlkIjoiZTEiLCJmcm9tIjoibjEiLCJ0byI6Im41IiwicG9sYXJpdHkiOjEsIndlaWdodCI6MSwiZGVsYXkiOiJzaG9ydCIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUyIiwiZnJvbSI6Im41IiwidG8iOiJuNiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUzIiwiZnJvbSI6Im42IiwidG8iOiJuMyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEuNSwiZGVsYXkiOiJzaG9ydCIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU0IiwiZnJvbSI6Im4zIiwidG8iOiJuNCIsInBvbGFyaXR5IjotMSwiTWVpZ2h0IjoxLCJkZWxheSI6Im1lZGl1bSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU1IiwiZnJvbSI6Im40IiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU2IiwiZnJvbSI6Im4xIiwidG8iOiJuMiIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoic2hvcnQiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiKWQiOiJlNyIsImZyb20iOiJuNyIsInRvIjoibjgiLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im1lZGl1bSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImU4IiwiZnJvbSI6Im44IiwidG8iOiJuNCIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEuNSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTkiLCJmcm9tIjoibjMiLCJ0byI6Im4xIiwicG9sYXJpdHkiOjEsIndlaWdodCI6MC41LCJkZWxheSI6Im1lZGl1bSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifSx7ImtpbmQiOiJjYXVzYWwiLCJpZCI6ImUxMCIsImZyb20iOiJuMiIsInRvIjoibjciLCJwb2xhcml0eSI6MSwid2VpZ2h0IjoxLCJkZWxheSI6Im5vbmUiLCJ0cmFuc2ZlckZuIjoibGluZWFyIn0seyJraW5kIjoiY2F1c2FsIiwiCWQiOiJlMTEiLCJmcm9tIjoibjgiLCJ0byI6Im42IiwicG9sYXJpdHkiOi0xLCJ3ZWlnaHQiOjAuNSwiZGVsYXkiOiJub25lIiwidHJhbnNmZXJGbiI6ImxpbmVhciJ9LHsia2luZCI6ImNhdXNhbCIsImlkIjoiZTEyIiwiZnJvbSI6Im40IiwidG8iOiJuNyIsInBvbGFyaXR5IjoxLCJ3ZWlnaHQiOjEsImRlbGF5Ijoibm9uZSIsInRyYW5zZmVyRm4iOiJsaW5lYXIifV19fQ==)

### The Story: Two Paths

This model reveals two competing strategies for responding to `Pressure`:

1. **Quick-Fix Path** (Visible in first 500 ticks): Pressure → Cheap Hiring → Low-skill Devs → Defects spike. The immediate win: `Velocity` jumps (short-term relief). But the cost is hidden by delays.

2. **Sustainable Path** (Emerges after 1000+ ticks): Quality improves → attracts Great Programmers → Mentoring Capacity grows → Quality climbs further. The system enters a virtuous cycle of improving both quality and long-term velocity.

**The Simulation Arc** (validated with 4,700+ ticks):

- **Ticks 2400–2603**: Baseline equilibrium. Pressure = 20 (stable), Velocity = 50, Quality = 70, all balanced.
- **Tick 2640: Pressure increases** (Pressure → 22). The system detects the crisis.
- **Tick 2700: Cheap Hiring activates** (Cheap Hiring Rate = 6, Short Delay). Low-skill Devs begin to rise.
- **Ticks 2820–2940: Crisis phase**.
  - Velocity peaks at 100 (felt as success by leadership).
  - Defects explode: 21 → 90 → 100 (exponential growth via Short Delay on Low-skill Devs edge).
  - Quality crashes: 53 → 44 → 41 (delayed consequence, Medium Delay on Defects → Quality edge).
  - Mentoring Capacity drops: 60 → 36 (overwhelmed by low-skill ratio).
- **Ticks 3000–3420: Recovery phase**.
  - Great Programmers surge: 54 → 80 → 100 (attracted by high velocity and quality emphasis).
  - Mentoring Capacity rebuilds: 38 → 94 → 100 (medium-term investment pays off).
  - Quality begins recovery: 41 → 100 (lagged, but unstoppable once mentoring investment completes).
  - Defects stabilize (no longer spiking; held by quality improvement).
- **Ticks 3480–4718: Equilibrium achieved**. All metrics converge to high levels: Pressure=22, Velocity=100, Defects=100, Quality=100, Great Programmers=100.

### Key Insight: The Virtue of Delays

The **Medium Delay** on Defects → Quality is crucial. Without it, quality would crash instantly and the organization would never recover. With it, there's a window where leadership feels the "quick-fix win" (Velocity spike) before the delayed consequences arrive (Defects spike).

However, the system **does recover** because:

1. The Quality → Great Programmers edge continuously attracts senior talent even during crisis
2. Great Programmers → Mentoring Capacity with Medium Delay means investmentin senior developers pays off predictably
3. Mentoring Capacity → Quality creates a strong recovery edge (Weight: 1.5)

**Red Flags in Your Organization**
If you observe:

- Velocity spikes immediately after a "hire more people" decision
- Defects rise 2-3 quarters later (when the quick-fix cost materializes)
- Quality recovery is slow and requires specific interventions (hiring senior talent)
- Mentoring capacity is chronically low, preventing new hires from becoming productive

…you're likely in the "Quick-Fix Path" of this model. The recovery path requires **deliberate investment in senior hires and knowledge transfer**—it doesn't happen automatically.

Implementation Tips for these Models
To make these really pop, you could utilize the "Known Limitations" as a roadmap:

Node Sizing: If you implement "node sized to relative range max," use it in the Market Saturation model. A Total Addressable Market node with a max: 50 should look physically massive compared to a Niche Market node with max: 5.
Lever Indicators: In your user guide or a "Welcome Model," mark the nodes intended for user interaction (like Marketing Effort) with a specific label or (per your README) a dedicated "Lever" visual style to prevent users from trying to "inject" into nodes that are meant to be purely emergent stocks.
