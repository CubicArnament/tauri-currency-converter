{
  description = "A complete Nix flake for the Tauri Currency Converter";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    crane.url = "github:ipetkov/crane";
    fenix.url = "github:nix-community/fenix";
  };

  outputs = { self, nixpkgs, flake-utils, crane, fenix }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };

        # Get the stable Rust toolchain
        rustToolchain = fenix.packages.${system}.stable.toolchain;

        # Crane library for building Rust dependencies
        craneLib = crane.lib.${system}.overrideToolchain rustToolchain;

        # Source directories
        src = ./.;
        tauri-src = ./src-tauri;

        # Build only the Cargo dependencies to cache them
        # This is used by both the dev shell and the final build
        cargoArtifacts = craneLib.buildDepsOnly {
          src = tauri-src;
          nativeBuildInputs = with pkgs; [
            pkg-config
          ];
          buildInputs = with pkgs; [
            webkitgtk gtk3 glib dbus openssl librsvg
          ];
        };

        # Main package for `nix build`
        tauriAppPackage = pkgs.stdenv.mkDerivation {
          pname = "tauri-currency-converter";
          version = "2.0.0"; # From package.json
          src = src;

          nativeBuildInputs = with pkgs; [
            # Frontend
            nodejs_20
            # Backend
            rustToolchain
            # Build tools
            pkg-config clang llvmPackages.bintools
            # Tauri system dependencies
            webkitgtk gtk3 glib dbus openssl librsvg appstream desktop-file-utils
          ];

          buildPhase = ''
            runHook preBuild

            export HOME=$(mktemp -d)

            # 1. Build frontend
            echo "Building frontend..."
            npm install
            npm run build

            # 2. Build backend and bundle with Tauri
            echo "Building backend and bundling..."
            cd src-tauri

            # Use pre-built Rust dependencies from crane for caching
            export CARGO_TARGET_DIR="../target"
            mkdir -p ../target
            ln -sf ${cargoArtifacts} ../target/release

            # Run the Tauri build command
            cargo tauri build --release

            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall

            # Install the final AppImage and .desktop file
            # The path is determined by the tauri build process
            local bundle_dir="src-tauri/target/release/bundle"
            install -Dm755 $bundle_dir/appimage/*.AppImage $out/bin/currency-converter
            install -Dm644 $bundle_dir/appimage/*.desktop $out/share/applications/com.xcubicarnament.currency-converter.desktop

            runHook postInstall
          '';
        };

      in
      {
        # For `nix build` -> ./result/bin/currency-converter
        packages.default = tauriAppPackage;

        # For `nix run`
        apps.default = flake-utils.lib.mkApp { drv = tauriAppPackage; };

        # For `nix flake check`
        checks.default = tauriAppPackage;

        # For `nix develop`
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            # Frontend
            nodejs_20
            # Backend
            rustToolchain
            # System libraries for Tauri
            webkitgtk gtk3 glib dbus openssl librsvg appstream desktop-file-utils
            # Build tools
            pkg-config clang llvmPackages.bintools
          ];

          # Environment for the development shell
          shellHook = ''
            # Point Cargo to the cached dependencies to speed up builds
            export CARGO_TARGET_DIR="target"
            mkdir -p target
            ln -sf ${cargoArtifacts} target/debug
            echo ""
            echo "----------------------------------------------------"
            echo "  Welcome to the Tauri Currency Converter shell!  "
            echo "----------------------------------------------------"
            echo ""
            echo "  To get started:"
            echo "    1. Run 'npm install' to fetch frontend packages."
            echo "    2. Run 'npm run tauri dev' to start the app."
            echo ""
          '';
        };
      }
    );
}
