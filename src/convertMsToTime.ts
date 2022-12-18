export const convertMsToTime = (ms: number) => {
  let seconds = Math.floor(ms / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  seconds = seconds % 60;
  minutes = minutes % 60;
  hours = hours % 24;

  let result: string = '';

  if(hours) {
    result += `${hours}h `;
  }
  if(minutes) {
    result += `${minutes}m `;
  }
  if(seconds) {
    result += `${seconds}s`;
  }
  
  return result;
}