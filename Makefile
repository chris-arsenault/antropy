.PHONY: ci lint lint-fix fmt format typecheck test docs-check terraform-fmt-check build deploy

ci: lint fmt typecheck test docs-check terraform-fmt-check

lint:
	cd frontend && pnpm exec eslint .

lint-fix:
	cd frontend && pnpm exec eslint . --fix

fmt:
	cd frontend && pnpm exec prettier --check .

format:
	cd frontend && pnpm exec prettier --write .

typecheck:
	cd frontend && pnpm exec tsc -b

test:
	cd frontend && pnpm exec vitest run

docs-check:
	test -f README.md
	test -f AGENTS.md
	test -f CLAUDE.md
	test -f docs/README.md
	test -f docs/design-spec.md
	test -f docs/architecture.md
	test -f docs/development.md
	test -f docs/backlog.md
	test -f docs/adr/README.md

terraform-fmt-check:
	terraform fmt -check -recursive infrastructure/terraform/

build:
	cd frontend && pnpm run build

deploy:
	scripts/deploy.sh
