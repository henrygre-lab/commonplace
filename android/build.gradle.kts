plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
}

/**
 * Build outputs go in `build.nosync/`, not `build/`.
 *
 * iCloud Drive syncs ~/Desktop by default, and it cannot keep up with the number
 * of files Gradle writes during a build. It resolves the race by leaving
 * conflict copies named `foo 2.jar` beside `foo.jar`, which then fail dexing
 * with "Type … is defined multiple times" — an error that reads like a code
 * problem and is not one.
 *
 * macOS excludes any path ending in `.nosync` from iCloud, so this keeps the
 * build intact wherever the repository is checked out. It is inert on machines
 * that do not sync at all.
 */
subprojects {
    layout.buildDirectory.set(layout.projectDirectory.dir("build.nosync"))
}
