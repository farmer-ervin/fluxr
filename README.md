# Kanban Board Tests

This project includes comprehensive test coverage for the Kanban Board page and components. Below is a summary of the tests and how to run them.

## Test Coverage

The tests ensure the following functionality:

1. **Drag and Drop**
   - Users can move items (features, pages, bugs, tasks) between columns
   - Implementation status is updated in the database on column change
   - Item positions are maintained within columns after drag and drop

2. **Adding Items**
   - Users can add new features, pages, bugs, and tasks from the board
   - The add dialog displays the correct fields for each item type
   - Required field validation works correctly
   - Newly added items appear on the page without a refresh

3. **Editing and Deleting**
   - Users can edit existing items
   - Users can delete items from the board
   - The edit dialog matches the add dialog for consistent UI

4. **Filtering**
   - Users can filter by item type (feature, page, bug, task)
   - Users can filter by priority (must-have, nice-to-have, not-prioritized)
   - Filters can be cleared

5. **Loading States**
   - Loading indicators are shown during initial data loading
   - Loading indicators are shown during item addition

## Running Tests

To run the tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run a specific test file
npm test -- src/path/to/test.test.ts
```

## Test Structure

- **Unit tests**: Testing individual components in isolation
- **Integration tests**: Testing component interactions
- **Mock data**: Used to simulate database operations

## Mock Services

The test suite includes mocks for:
- Supabase database operations
- Authentication
- Drag and drop functionality
- Analytics tracking 