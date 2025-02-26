import React from "react";

const DateRange = (starts_at, ends_at) => {
  const startDate = moment(starts_at);
  const endDate = moment(ends_at);
  const currentDate = moment();

  let dateElement = <></>
  if (currentDate.isBefore(startDate)) {
    const diffHours = currentDate.diff(startDate, 'hours')
    const time = diffHours > 12 ? startDate.format('LL') : startDate.fromNow()
    dateElement = <i className='text-muted'>Empieza {time}</i>
  } else if (currentDate.isAfter(endDate)) {
    const diffHours = currentDate.diff(endDate, 'hours')
    const time = diffHours > 12 ? endDate.format('LL') : endDate.fromNow()
    dateElement = <i className='text-muted'>Finalizo {time}</i>
  } else {
    const totalDuration = endDate.diff(startDate);
    const elapsedDuration = currentDate.diff(startDate);
    const percentageElapsed = (elapsedDuration / totalDuration) * 100;

    const getProgressBarColor = (percentage) => {
      if (percentage <= 33.333) return 'success';
      // if (percentage <= 50) return 'primary';
      if (percentage <= 66.667) return 'warning';
      return 'danger';
    }

    const progressColor = getProgressBarColor(percentageElapsed);
    
    dateElement = <div style={{ width: '200px' }}>
      <p className='mb-0 d-flex justify-content-between'>
        <span>{moment(starts_at).format('DD MMM YYYY')}</span>
        <span className='float-end'>{moment(ends_at).format('DD MMM YYYY')}</span>
      </p>
      <div className={`progress progress-bar-alt-${progressColor} progress-xl mb-0 mt-0`}>
        <div className={`progress-bar bg-${progressColor} progress-bar-animated`} 
             role="progressbar" 
             aria-valuenow={percentageElapsed} 
             aria-valuemin="0" 
             aria-valuemax="100" 
             style={{ width: `${percentageElapsed}%` }}>
          {percentageElapsed.toFixed(2)}%
        </div>
      </div>
    </div>
  }

  return dateElement
}

export default DateRange