const timeFormat = (min) => {
    const hours = Math.floor(min / 60);
    const minutesRemainder = min % 60;

    return `${hours}h ${minutesRemainder}m`;
}

export default timeFormat;