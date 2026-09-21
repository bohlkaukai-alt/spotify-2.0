export async function downloadTrack(track) {
  const res = await fetch(`/api/stream/${track.id}`);
  if (!res.ok) throw new Error('Download fehlgeschlagen');

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${track.artist} - ${track.title}.mp3`.replace(/[\/\\:]/g, '_');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
