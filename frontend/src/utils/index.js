export const filterWithoutCurrentUser = (users, currentUser) =>
  Object.fromEntries(Object.entries(users).filter(([key]) => key !== currentUser.uid))
