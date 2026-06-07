export const runningTerms = [
  { term: 'Easy run', summary: 'A relaxed run where you can speak in full sentences.', detail: 'Easy runs build aerobic fitness without adding too much stress. Most beginner running should feel easy, not forced.' },
  { term: 'Recovery run', summary: 'A very gentle run after harder or longer training.', detail: 'The goal is to move lightly and feel better afterward. If you feel worse, walking or rest is the better choice.' },
  { term: 'Long run', summary: 'The longest run of the week, usually done at easy effort.', detail: 'Long runs build endurance. They should feel controlled, not like a race.' },
  { term: 'Tempo run', summary: 'A comfortably hard run that teaches controlled speed.', detail: 'Tempo effort should feel challenging but sustainable. You should not be sprinting or gasping.' },
  { term: 'Intervals', summary: 'Short faster efforts separated by easier recovery.', detail: 'Intervals help speed and running economy. They should be smooth and controlled, not all-out.' },
  { term: 'Strides', summary: 'Short relaxed accelerations, usually 10 to 30 seconds.', detail: 'Strides practice quick, smooth running form without turning the workout into a hard session.' },
  { term: 'Pace', summary: 'How long it takes to cover a distance, often minutes per kilometer.', detail: 'Pace is useful data, but beginners should usually focus on effort first.' },
  { term: 'Cadence', summary: 'How many steps you take per minute.', detail: 'Cadence can affect running rhythm, but there is no single perfect number for everyone.' },
  { term: 'Aerobic base', summary: 'Your foundation for running longer and recovering better.', detail: 'Base fitness grows from consistent easy running over time.' },
  { term: 'RPE / effort', summary: 'A 1 to 10 rating of how hard the run feels.', detail: 'RPE helps you train by feel. Easy runs are usually around 3 to 4 out of 10.' },
  { term: 'Warmup', summary: 'Gentle movement before the main workout.', detail: 'Warmups prepare your body and make the first part of the run feel less abrupt.' },
  { term: 'Cooldown', summary: 'Easy movement after the main workout.', detail: 'Cooldowns help your body settle after running. Walking is perfectly fine.' },
  { term: 'Progression', summary: 'A gradual increase in training over time.', detail: 'Good progression gives your body time to adapt instead of suddenly adding too much load.' },
  { term: 'Taper', summary: 'A planned reduction in training before a race or goal effort.', detail: 'Tapering helps you arrive fresher by reducing load while keeping some routine.' },
  { term: 'Overtraining', summary: 'Doing more than your body can recover from.', detail: 'Warning signs can include unusual fatigue, poor sleep, persistent soreness, rising pain, or loss of motivation.' },
];

export function filterRunningTerms(query = '') {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return runningTerms;

  return runningTerms.filter((item) =>
    item.term.toLowerCase().includes(normalized)
    || item.summary.toLowerCase().includes(normalized)
    || item.detail.toLowerCase().includes(normalized)
  );
}
