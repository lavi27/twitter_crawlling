const wait = (timeout: number) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve(null);
    }, timeout);
  });
}

export default wait