export const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};

export const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
};

export const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const isDatePast = (year, month, day) => {
    const today = new Date();
    const date = new Date(year, month, day);
    return date < today.setHours(0, 0, 0, 0);
};
