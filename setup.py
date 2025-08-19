from setuptools import setup, find_packages

setup(
    name="crop_model",
    version="0.1.4",
    author="liuming",
    description="Simulation engine for AgWeatherNet Nutrient Management System",
    packages=find_packages(),
    include_package_data=True,
    package_data={
        "crop_model": ["irrigationtables/*.csv"]
    },
    install_requires=[
        "pandas>=1.5.0",
        "numpy>=1.21.0",
        "requests>=2.28.0",
        "shapely>=2.0.0"
    ],
    python_requires=">=3.8",
)
