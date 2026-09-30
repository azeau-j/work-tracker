# Spec: Option d'affichage décimal pour les rapports de temps

## Problem Statement

When reviewing tracked work times or exporting hours to company time-tracking systems (like SAP, ERP, or spreadsheet timesheets), users frequently need their logged hours expressed in decimal format (e.g., `1.5h`, `7.8h`) rather than hours and minutes (e.g., `1h 30m`, `7h 45m`). Currently, the report only outputs durations in the traditional `Xh Ym` format, requiring users to manually convert minutes into fractions of hours.

## Solution

Provide a `--decimal` CLI option for the report command that formats all displayed durations as decimal hours. By default, the tool continues to display durations in the traditional `Xh Ym` format to maintain backwards compatibility, but when `--decimal` is specified, summary totals, individual project breakdowns, and detailed daily views display hours rounded to one decimal place (e.g., `1.5h` or `1.3h`).

## User Stories

1. As a user, I want to run the report command with a `--decimal` flag, so that I can see project durations expressed in decimal hours.
2. As a user, I want the summary report to display decimal hours per project when the decimal option is active, so that I can easily copy these values into external billing and time tracking software.
3. As a user, I want the detailed daily report to display daily project durations in decimal format when the decimal flag is active, so that I can report exact daily hours without mental math.
4. As a user, I want the overall total worked time in the report outro to be formatted in decimal hours when using `--decimal`, so that I can quickly verify the total hours worked over the selected period.
5. As a user, I want the traditional `Xh Ym` formatting to remain the default when running the report without flags, so that my existing habits and workflows are not disrupted.
6. As a user, I want decimal values to omit unnecessary trailing zeros or format cleanly (e.g., `1h` instead of `1.0h`, or up to 1 decimal place), so that the output remains clean and easy to read.
7. As a user, I want zero-duration projects or days to format as `0h`, so that the display remains consistent and clear.
8. As a user, I want the `--decimal` flag to work seamlessly with other report options like `-p, --period` and `-d, --detail`, so that I can combine time periods, granularity, and formatting styles freely.
9. As a user, I want the `--decimal` flag to work alongside the `-t, --target-day-hours` extrapolation option, so that extrapolated hours can also be reviewed in decimal format.
10. As a user, I want the progress bars in the summary view to continue reflecting accurate relative percentages regardless of whether decimal or standard notation is chosen, so that the visual indicators remain helpful.

## Implementation Decisions

- **Inbound CLI Adapter Enhancements**:
  - The CLI report command options interface will be updated to include an optional boolean flag for decimal display.
  - The CLI argument parser will register the `--decimal` option with an appropriate description for user help messages.
- **Duration Formatting Abstraction**:
  - A dedicated duration formatting utility function will be created within the presentation layer. It will accept a duration in minutes and a boolean flag indicating whether decimal output is desired.
  - When decimal mode is enabled, duration will be calculated as `minutes / 60` rounded to one decimal place (trimming redundant trailing decimals where appropriate) and suffixed with `h`.
  - When standard mode is enabled (default), duration will be calculated using floor division for hours and modulo for minutes, formatted as `Xh Ym`.
- **Presentation Component Updates**:
  - Both summary and detailed report presenters will consume the duration formatting utility rather than embedding inline hour/minute mathematical calculations.
  - The report completion message (outro) will use the same duration formatting utility to guarantee consistent styling across all sections of the report.
- **Extrapolation Quantization in Decimal Mode**:
  - When `--target-day-hours` is used in conjunction with `--decimal`, the use case quantizes extrapolated project durations by 6-minute increments (0.1h). This prevents independent decimal roundings from producing sum mismatches (e.g., 4.4h + 3.7h = 8.1h instead of 8.0h). Remainder compensation ensures the daily total matches the target day hours exactly.

## Testing Decisions

- **Testing Philosophy**:
  - Tests must assert observable external behavior, verifying that the user sees the expected output without coupling tests to internal state or implementation details.
- **Unit Testing (Narrow Seam)**:
  - Unit tests will focus on the Duration Formatting utility across various edge cases and durations (e.g., `0m` -> `0h` or `0h 0m`, `30m` -> `0.5h` or `0h 30m`, `45m` -> `0.8h` or `0h 45m`, `90m` -> `1.5h` or `1h 30m`, recurring decimals like `20m` -> `0.3h` or `0h 20m`).
- **Integration Testing (Broad Seam)**:
  - Integration tests will target the CLI report execution flow. By passing options containing `decimal: true` and verifying the logged output of the report presenter, we ensure the entire pipeline (option parsing, use case consumption, and final visual formatting) behaves as expected.
- **Prior Art**:
  - Existing use-case tests (`GetReport.spec.ts`) serve as reference for structuring mock report data and validating calculated totals.

## Out of Scope

- Support for decimal duration input in the `log` command (e.g. entering `1.5h` when logging hours).
- Modifying the output of the `status` command or live timer notifications to use decimal formatting.
- Persisting decimal preferences in user configuration (the default remains standard `Xh Ym` unless the flag is passed).

## Further Notes

- The project uses `commander` for CLI option parsing and `@clack/prompts` for terminal logging. The implementation will follow these existing conventions.
